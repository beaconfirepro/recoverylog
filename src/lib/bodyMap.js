// One silhouette, drawn once and reused by every tracker that asks where. The
// path is a closed outline in a 200 × 470 box, so the marks below are placed in
// the same coordinates whatever size it renders at.
export const SILHOUETTE =
  "M 100 12 C 120 12 132 26 132 46 C 132 66 122 78 113 82 C 113 88 114 93 117 97 " +
  "C 133 103 150 113 157 130 C 165 154 171 182 173 212 C 176 234 172 250 164 250 " +
  "C 157 250 156 236 154 214 C 150 184 145 158 139 144 C 137 170 135 194 135 216 " +
  "C 135 244 139 268 137 296 C 136 338 132 390 128 436 C 127 450 120 456 113 453 " +
  "C 107 450 108 442 108 432 C 108 388 106 344 102 308 C 101 304 100 302 100 300 " +
  "C 100 302 99 304 98 308 C 94 344 92 388 92 432 C 92 442 93 450 87 453 " +
  "C 80 456 73 450 72 436 C 68 390 64 338 63 296 C 61 268 65 244 65 216 " +
  "C 65 194 63 170 61 144 C 55 158 50 184 46 214 C 44 236 43 250 36 250 " +
  "C 28 250 24 234 27 212 C 29 182 35 154 43 130 C 50 113 67 103 83 97 " +
  "C 86 93 87 88 87 82 C 78 78 68 66 68 46 C 68 26 80 12 100 12 Z";

// Left and right are the patient's, so on the front view her left sits on the
// right of the drawing and on the back view it sits on the left. Getting this
// backwards would put a finding on the wrong leg in a record a surgeon reads.
//
// Front and back are different parts, not two views of the same one: a
// hamstring is not a thigh and a shin is not a calf. Where a name would
// otherwise repeat across the two views, the view is in the name.
export const MARKS = {
  front: {
    Neck: [100, 86],
    "Left shoulder": [136, 108],
    "Right shoulder": [64, 108],
    Chest: [100, 124],
    "Left armpit": [130, 133],
    "Right armpit": [70, 133],
    "Left rib cage (front)": [123, 162],
    "Right rib cage (front)": [77, 162],
    Abdomen: [100, 196],
    "Left hip (front)": [126, 231],
    "Right hip (front)": [74, 231],
    "Pelvic girdle": [100, 252],
    "Left bicep": [151, 172],
    "Right bicep": [49, 172],
    "Left wrist": [158, 226],
    "Right wrist": [42, 226],
    "Left hand": [162, 247],
    "Right hand": [38, 247],
    "Left thigh": [118, 300],
    "Right thigh": [82, 300],
    "Left shin": [114, 392],
    "Right shin": [86, 392],
    "Left foot": [112, 444],
    "Right foot": [88, 444]
  },
  back: {
    Neck: [100, 86],
    "Left shoulder": [64, 108],
    "Right shoulder": [136, 108],
    "Left shoulder blade": [78, 136],
    "Right shoulder blade": [122, 136],
    "Upper back": [100, 148],
    "Left rib cage (back)": [77, 176],
    "Right rib cage (back)": [123, 176],
    "Lower back": [100, 203],
    "Left hip (back)": [74, 231],
    "Right hip (back)": [126, 231],
    "Left glute": [86, 258],
    "Right glute": [114, 258],
    "Left tricep": [49, 172],
    "Right tricep": [151, 172],
    "Left wrist": [42, 226],
    "Right wrist": [158, 226],
    "Left hand": [38, 247],
    "Right hand": [162, 247],
    "Left hamstring": [82, 300],
    "Right hamstring": [118, 300],
    "Left calf": [86, 392],
    "Right calf": [114, 392],
    "Left foot": [88, 444],
    "Right foot": [112, 444]
  }
};

// Every part the map can mark, front and back, without repeats. This is what
// the rest of the app matches against, so it is derived from the drawing rather
// than kept beside it and left to drift.
export const BODY_PARTS = [
  ...new Set([...Object.keys(MARKS.front), ...Object.keys(MARKS.back)])
];
