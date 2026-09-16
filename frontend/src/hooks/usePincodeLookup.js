import { useState, useCallback, useRef } from "react";
import i18next from "../i18n";

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
      setError(i18next.t("pincode.invalid"));
      if (onError) onError(i18next.t("pincode.invalid"));
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
          setError(i18next.t("pincode.invalid"));
          if (onError) onError(i18next.t("pincode.invalid"));
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
          setError(i18next.t("pincode.invalid"));
          if (onError) onError(i18next.t("pincode.invalid"));
          return;
        }

        const postOffice = data[0].PostOffice?.[0];
        if (!postOffice) {
          pincodeCache.set(digits, null);
          setError(i18next.t("pincode.invalid"));
          if (onError) onError(i18next.t("pincode.invalid"));
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
        setError(i18next.t("pincode.unableToFetch"));
        if (onError) onError(i18next.t("pincode.unableToFetch"));
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