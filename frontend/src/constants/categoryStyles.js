export const CATEGORY_STYLES = {
  1:  { color: '#4AA8D8', image: '🧊' },         // Cold Brew Coffee
  4:  { color: '#8B4513', image: '❄️' },        // Espresso Based (Iced)
  2:  { color: '#C97B63', image: '☕' },          // Hot Coffee
  8:  { color: '#A37BCC', image: '🧋' },          // Milk-Based
  5:  { color: '#FFAB76', image: '🍹' },         // Non-Coffee
  11: { color: '#323267', image: '🌙' },          // OD's After Hours
  10: { color: '#FFB3D1', image: '🧃' },         // OD Float
  7:  { color: '#7FDBFF', image: '🫧' },         // OD Fuzz
  9:  { color: '#FFE066', image: '🍋' },         // OD Lemonade
  6:  { color: '#F78FB3', image: '🥤' },         // OD Milkshake
  3:  { color: '#5C4033', image: '🍪' },         // Pastries
  12: { color: '#72D572', image: '💪' }          // Protein Blends
};

export const DEFAULT_CATEGORY_STYLE = { 
  color: '#e0a74a',
  image: '🍽️'
};

export const getCategoryStyle = (categoryId) => {
  return CATEGORY_STYLES[categoryId] || DEFAULT_CATEGORY_STYLE;
};
