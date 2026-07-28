export const getDiff = (oldObj: any, newObj: any, keysToKeep: string[] = []) => {
  const diffOld: any = {};
  const diffNew: any = {};
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  for (const key of allKeys) {
    if (keysToKeep.length > 0 && !keysToKeep.includes(key)) continue;
    if (JSON.stringify(oldObj?.[key]) !== JSON.stringify(newObj?.[key])) {
      if (oldObj?.[key] !== undefined) diffOld[key] = oldObj[key];
      if (newObj?.[key] !== undefined) diffNew[key] = newObj[key];
    }
  }
  return { diffOld, diffNew };
};
