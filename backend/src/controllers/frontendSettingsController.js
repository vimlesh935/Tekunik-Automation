const { query } = require("../config/db");

const getFrontendSettings = async (req, res, next) => {
  try {
    let [settings] = await query("SELECT * FROM website_frontend_information WHERE id = 1 LIMIT 1");
    if (!settings) {
      await query("INSERT INTO website_frontend_information (id, company_name) VALUES (1, 'Tekunik Automation') ON DUPLICATE KEY UPDATE company_name = company_name");
      [settings] = await query("SELECT * FROM website_frontend_information WHERE id = 1 LIMIT 1");
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateFrontendSettings = async (req, res, next) => {
  try {
    const allowedFields = [
      "company_name", "company_tagline", "company_description", "company_logo", "company_favicon",
      "company_email", "company_phone", "company_whatsapp", "company_address", "city", "state",
      "country", "postal_code", "google_maps_url", "google_maps_link", "support_email",
      "sales_email", "website_url", "facebook_url", "instagram_url", "linkedin_url", "youtube_url",
      "twitter_url", "copyright_text", "footer_about", "business_hours", "privacy_policy_url",
      "terms_conditions_url", "refund_policy_url", "shipping_policy_url",
    ];

    const updates = [];
    const values = [];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    values.push(1);
    await query(`UPDATE website_frontend_information SET ${updates.join(", ")} WHERE id = ?`, values);

    const [settings] = await query("SELECT * FROM website_frontend_information WHERE id = 1 LIMIT 1");
    res.json({ success: true, data: settings, message: "Frontend settings updated successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFrontendSettings, updateFrontendSettings };

