import { useState, useCallback, useRef } from "react";

const PINCODE_API = "https://api.postalpincode.in/pincode";

const pincodeCache = new Map();

export function usePincodeLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const lookup = useCallback((pincode, onSuccess, onError) => {
    const digits = pincode.replace(/\D/g, "");

    if (digits.length !== 6) {
      setError("");
      return;
    }

    if (!/^\d{6}$/.test(digits)) {
      setError("Invalid Pincode");
      if (onError) onError("Invalid Pincode");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (pincodeCache.has(digits)) {
        const cached = pincodeCache.get(digits);
        if (cached) {
          setError("");
          if (onSuccess) onSuccess(cached);
        } else {
          setError("Invalid Pincode");
          if (onError) onError("Invalid Pincode");
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${PINCODE_API}/${digits}`);

        if (!res.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await res.json();

        if (!data || !data[0] || data[0].Status !== "Success") {
          pincodeCache.set(digits, null);
          setError("Invalid Pincode");
          if (onError) onError("Invalid Pincode");
          return;
        }

        const postOffice = data[0].PostOffice?.[0];
        if (!postOffice) {
          pincodeCache.set(digits, null);
          setError("Invalid Pincode");
          if (onError) onError("Invalid Pincode");
          return;
        }

        const result = {
          city: postOffice.District || "",
          state: postOffice.State || "",
        };

        pincodeCache.set(digits, result);
        setError("");
        if (onSuccess) onSuccess(result);
      } catch (err) {
        console.error("Pincode lookup failed:", err);
        setError("Unable to fetch location. Please try again.");
        if (onError) onError("Unable to fetch location. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { loading, error, lookup };
}