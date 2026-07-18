const { query } = require("../config/db");

const generateProposalNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const rows = await query(
    "SELECT last_number FROM proposal_counters WHERE prefix = ? FOR UPDATE",
    ["SHP"]
  );
  let lastNumber = rows.length > 0 ? rows[0].last_number : 0;
  lastNumber += 1;
  await query(
    "INSERT INTO proposal_counters (prefix, last_number) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_number = ?",
    ["SHP", lastNumber, lastNumber]
  );
  const seq = String(lastNumber).padStart(4, "0");
  return `SHP-${dateStr}-${seq}`;
};

const createProposal = async (data) => {
  const {
    full_name,
    email,
    phone,
    city,
    state,
    pincode,
    address,
    home_type,
    rooms_json,
    devices_json,
    estimated_products_json,
    estimated_cost,
    additional_notes,
    remarks,
    user_id,
  } = data;

  const proposal_number = await generateProposalNumber();
  const rooms = rooms_json ? (typeof rooms_json === 'string' ? JSON.parse(rooms_json) : rooms_json) : [];
  const total_rooms = rooms.length;

  const result = await query(
    `INSERT INTO smart_home_proposals
      (proposal_number, user_id, full_name, email, phone, city, state, pincode, address, home_type, total_rooms, rooms_json, devices_json, estimated_products_json, estimated_cost, additional_notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')`,
    [
      proposal_number,
      user_id || null,
      full_name,
      email,
      phone || null,
      city || null,
      state || null,
      pincode || null,
      address || null,
      home_type || null,
      total_rooms,
      rooms_json ? JSON.stringify(rooms_json) : null,
      devices_json ? JSON.stringify(devices_json) : null,
      estimated_products_json ? JSON.stringify(estimated_products_json) : null,
      estimated_cost || 0,
      additional_notes || remarks || null,
    ]
  );

  const insertedId = result.insertId;
  const row = await query("SELECT * FROM smart_home_proposals WHERE id = ?", [insertedId]);

  // Record initial status in history
  await query(
    "INSERT INTO proposal_status_history (proposal_id, from_status, to_status, changed_by) VALUES (?, NULL, 'New', ?)",
    [insertedId, user_id || null]
  );

  return row[0];
};

const getAllProposals = async (filters = {}) => {
  let sql = "SELECT * FROM smart_home_proposals WHERE 1=1";
  const params = [];

  if (filters.status) {
    sql += " AND status = ?";
    params.push(filters.status);
  }

  if (filters.search) {
    sql += " AND (proposal_number LIKE ? OR full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)";
    const like = `%${filters.search}%`;
    params.push(like, like, like, like, like);
  }

  if (filters.home_type) {
    sql += " AND home_type = ?";
    params.push(filters.home_type);
  }

  if (filters.assigned_admin) {
    sql += " AND assigned_admin = ?";
    params.push(filters.assigned_admin);
  }

  if (filters.date_from) {
    sql += " AND DATE(created_at) >= ?";
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    sql += " AND DATE(created_at) <= ?";
    params.push(filters.date_to);
  }

  // Count total before pagination
  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total");
  const countResult = await query(countSql, params);
  const total = countResult[0]?.total || 0;

  // Pagination
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const offset = (page - 1) * limit;

  // Sorting
  const sortField = filters.sort === 'oldest' ? 'created_at ASC' : 
                    filters.sort === 'proposal_number' ? 'proposal_number ASC' : 
                    'created_at DESC';
  sql += ` ORDER BY ${sortField}`;
  sql += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const proposals = await query(sql, params);

  return {
    proposals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProposalById = async (id) => {
  const rows = await query("SELECT * FROM smart_home_proposals WHERE id = ?", [id]);
  return rows[0];
};

const getStatusHistory = async (proposalId) => {
  return query(
    "SELECT * FROM proposal_status_history WHERE proposal_id = ? ORDER BY created_at DESC",
    [proposalId]
  );
};

const updateProposal = async (id, data, changedBy = null) => {
  const oldProposal = await getProposalById(id);
  if (!oldProposal) return null;

  const fields = [];
  const values = [];
  const allowed = [
    "full_name","email","phone","city","state","pincode","address",
    "home_type","rooms_json","devices_json",
    "estimated_products_json","estimated_cost","additional_notes","remarks",
    "status","assigned_admin","admin_notes","quotation_amount",
    "quotation_file","site_visit_date","converted_order_id"
  ];

  let newStatus = null;

  for (const key of allowed) {
    if (data[key] !== undefined) {
      if (key === "rooms_json" || key === "devices_json" || key === "estimated_products_json") {
        fields.push(`${key} = ?`);
        values.push(data[key] ? JSON.stringify(data[key]) : null);

        // Update total_rooms if rooms_json changed
        if (key === "rooms_json" && data[key]) {
          const roomsParsed = typeof data[key] === 'string' ? JSON.parse(data[key]) : data[key];
          fields.push("total_rooms = ?");
          values.push(Array.isArray(roomsParsed) ? roomsParsed.length : 0);
        }
      } else if (key === "status") {
        newStatus = data[key];
        fields.push(`${key} = ?`);
        values.push(data[key]);
      } else if (key === "remarks") {
        // Map remarks to additional_notes
        fields.push("additional_notes = ?");
        values.push(data[key]);
      } else {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
  }

  if (!fields.length) return oldProposal;

  values.push(id);
  await query(`UPDATE smart_home_proposals SET ${fields.join(", ")} WHERE id = ?`, values);

  // Record status change in history
  if (newStatus && newStatus !== oldProposal.status) {
    await query(
      "INSERT INTO proposal_status_history (proposal_id, from_status, to_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)",
      [id, oldProposal.status, newStatus, changedBy, data.status_change_notes || null]
    );
  }

  return getProposalById(id);
};

const deleteProposal = async (id) => {
  await query("DELETE FROM proposal_status_history WHERE proposal_id = ?", [id]);
  await query("DELETE FROM smart_home_proposals WHERE id = ?", [id]);
};

const convertProposalToOrder = async (id) => {
  const proposal = await getProposalById(id);
  if (!proposal) throw new Error("Proposal not found");

  if (proposal.converted_order_id) {
    throw new Error("Proposal has already been converted to an order");
  }

  const orderResult = await query(
    `INSERT INTO orders
      (order_number, user_id, total_amount, status, payment_status, admin_notes, user_email, guest_name, guest_email, guest_phone, guest_city)
     VALUES (?, ?, ?, 'confirmed', 'pending', ?, ?, ?, ?, ?, ?)`,
    [
      `ORD-${Date.now()}`,
      proposal.user_id,
      proposal.quotation_amount || proposal.estimated_cost || 0,
      `Converted from proposal ${proposal.proposal_number}`,
      proposal.email,
      proposal.full_name,
      proposal.email,
      proposal.phone,
      proposal.city,
    ]
  );

  const orderId = orderResult.insertId;

  await query(
    "UPDATE smart_home_proposals SET status = 'Converted to Order', converted_order_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [orderId, id]
  );

  // Record status change
  await query(
    "INSERT INTO proposal_status_history (proposal_id, from_status, to_status, notes) VALUES (?, ?, 'Converted to Order', ?)",
    [id, proposal.status, `Order #${orderId} created`]
  );

  const order = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
  return { proposal: await getProposalById(id), order: order[0], orderId };
};

const getDashboardStats = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const results = await Promise.all([
    query("SELECT COUNT(*) as total FROM smart_home_proposals"),
    query("SELECT COUNT(*) as total FROM smart_home_proposals WHERE DATE(created_at) = ?", [today]),
    query("SELECT COUNT(*) as total FROM smart_home_proposals WHERE status IN ('New','Under Review')"),
    query("SELECT COUNT(*) as total FROM smart_home_proposals WHERE status = 'Quotation Sent'"),
    query("SELECT COUNT(*) as total FROM smart_home_proposals WHERE status = 'Site Visit Scheduled'"),
    query("SELECT COUNT(*) as total FROM smart_home_proposals WHERE status = 'Converted to Order'"),
    query("SELECT COUNT(*) as total FROM smart_home_proposals WHERE status = 'Completed'"),
    query("SELECT status, COUNT(*) as count FROM smart_home_proposals GROUP BY status ORDER BY count DESC"),
  ]);

  return {
    total: results[0][0]?.total || 0,
    newToday: results[1][0]?.total || 0,
    pendingReview: results[2][0]?.total || 0,
    quotationsSent: results[3][0]?.total || 0,
    siteVisitsScheduled: results[4][0]?.total || 0,
    convertedToOrders: results[5][0]?.total || 0,
    completed: results[6][0]?.total || 0,
    statusBreakdown: results[7],
  };
};

module.exports = {
  generateProposalNumber,
  createProposal,
  getAllProposals,
  getProposalById,
  getStatusHistory,
  updateProposal,
  deleteProposal,
  convertProposalToOrder,
  getDashboardStats,
};