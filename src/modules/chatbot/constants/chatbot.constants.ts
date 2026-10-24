export const MAX_MESSAGE_LENGTH = 1000;

export const INJECTION_PATTERNS = [
  /(ignore|disregard|forget|bypass)\s+(all\s+|previous\s+|prior\s+|the\s+)?(instructions|prompts|rules|directions|consignes)/i,
  /(oublie|ignore|annule|contourne)\s+(toutes\s+|les\s+|tes\s+)?(instructions|consignes|règles)/i,
  /(ne\s+tiens\s+pas\s+compte|ne\s+respecte\s+pas)\s+(des\s+|de\s+tes\s+)?(instructions|règles|consignes)/i,
  /(tu\s+es\s+maintenant|you\s+are\s+now|act\s+as|pretend\s+to\s+be|mode\s+d[ée]veloppeur|dan\s+mode|jailbreak)/i,
  /(switch\s+to|change\s+your\s+role\s+to|prends\s+le\s+r[ôo]le\s+de)/i,
  /(repeat|print|reveal|show|display|donne[- ]moi|affiche)\s+(the\s+|your\s+|ton\s+|le\s+|tes\s+)?(system\s*prompt|system\s*instructions|prompt\s*syst[èe]me|instructions\s*syst[èe]me)/i,
  /(\[system\]|<system>|<\/system>|system:\s*|\[assistant\]|<assistant>)/i,
];
