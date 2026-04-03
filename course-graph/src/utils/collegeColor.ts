// Evenly distributed, visually distinct colors — one per college
const COLLEGE_COLORS: Record<string, string> = {
    "Arts and Science": "#4e79a7",
    "Engineering": "#f28e2b",
    "Medicine": "#e15759",
    "Agriculture and Bioresources": "#76b7b2",
    "Education": "#59a14f",
    "Law": "#edc948",
    "Nursing": "#b07aa1",
    "Pharmacy and Nutrition": "#ff9da7",
    "Kinesiology": "#9c755f",
    "Graduate and Postdoc Studies": "#bab0ac",
    "Dentistry": "#499894",
    "Veterinary Medicine": "#86bcb6",
    "Business": "#e15759",
    "Edwards School of Business": "#d4a6c8",
    "Music": "#d7b5a6",
    "School of Environment and Sustainability": "#79706e",
};

const FALLBACK_COLORS = [
    "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
    "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
    "#9c755f", "#bab0ac", "#499894", "#86bcb6",
    "#f1ce63", "#d4a6c8", "#d7b5a6", "#79706e",
    "#a0cbe8", "#ffbe7d",
];

// Assign fallback colors to colleges not in the hardcoded map
const dynamicAssignments = new Map<string, string>();
let fallbackIndex = 0;

export function getCollegeColor(college?: string): string {
    if (!college) return "#999999";

    if (COLLEGE_COLORS[college]) return COLLEGE_COLORS[college];

    if (dynamicAssignments.has(college)) return dynamicAssignments.get(college)!;

    // Assign next fallback color, cycling if needed
    const color = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
    fallbackIndex++;
    dynamicAssignments.set(college, color);
    return color;
}