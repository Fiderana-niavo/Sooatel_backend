const normalize = (val: unknown): unknown => {
  if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))) return Number(val);
  return val;
};

export const getDiff = (oldObj: any, newObj: any, keysToKeep: string[] = []) => {
  const diffOld: any = {};
  const diffNew: any = {};
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  for (const key of allKeys) {
    if (keysToKeep.length > 0 && !keysToKeep.includes(key)) continue;
    const oldVal = normalize(oldObj?.[key]);
    const newVal = normalize(newObj?.[key]);
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (oldObj?.[key] !== undefined) diffOld[key] = oldObj[key];
      if (newObj?.[key] !== undefined) diffNew[key] = newObj[key];
    }
  }
  return { diffOld, diffNew };
};
