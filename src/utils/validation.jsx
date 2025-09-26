export  const validateAndNormalizeUrl = (value) => {
  if (!value) return { error: "Link is required", url: "" };
  try {
    const u = new URL(value);
    if (!u.hostname.includes(".")) throw new Error("Invalid host");
    return { error: "", url: u.toString() };
  } catch {
    try {
      const fixed = `https://${value}`;
      const u = new URL(fixed);
      if (!u.hostname.includes(".")) throw new Error("Invalid host");
      return { error: "", url: u.toString() };
    } catch {
      return {
        error: "Enter a valid URL (e.g. https://company.com/job)",
        url: "",
      };
    }
  }
};
