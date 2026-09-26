/**
 * The app's name rotates on every page load among these alliterative
 * aliases. Each carries an emoji and an accent color that the layout
 * exposes as the `--accent` CSS variable. Tor reviews this list before launch.
 */
export interface Alias {
  name: string;
  emoji: string;
  accent: string;
  tagline: string;
}

export const ALIASES: readonly Alias[] = [
  { name: "Secret Santa", emoji: "🎅", accent: "#B85C2A", tagline: "ho ho who?" },
  { name: "Mysterious Moses", emoji: "🌊", accent: "#5A9AB0", tagline: "parting the wrapping paper" },
  { name: "Bashful Buddha", emoji: "🪷", accent: "#7A8C6E", tagline: "let go of knowing who" },
  { name: "Kryptic Krishna", emoji: "🪈", accent: "#5B6FB8", tagline: "a gift plays in the dark" },
  { name: "Guarded Ganesha", emoji: "🐘", accent: "#C9793B", tagline: "remover of gift-obstacles" },
  { name: "Covert Confucius", emoji: "📜", accent: "#8B4520", tagline: "the wise giver tells no one" },
  { name: "Veiled Vishnu", emoji: "🐚", accent: "#4F86A8", tagline: "preserver of surprises" },
  { name: "Low-key Loki", emoji: "🐍", accent: "#6E8F4E", tagline: "trickster, but nice this time" },
  { name: "Obscure Odin", emoji: "🐦‍⬛", accent: "#4A4E69", tagline: "one eye on your wish list" },
  { name: "Enigmatic Elijah", emoji: "🔥", accent: "#C4552D", tagline: "there's an extra seat for you" },
  { name: "Shrouded Shiva", emoji: "🔱", accent: "#3E6B8C", tagline: "destroyer of spoilers" },
  { name: "Furtive Freyja", emoji: "🐈", accent: "#B4657A", tagline: "quietly generous" },
  { name: "Incognito Imam", emoji: "🌙", accent: "#2E7D6B", tagline: "charity, but make it sneaky" },
  { name: "Zipped-lip Zeus", emoji: "⚡", accent: "#D4A03A", tagline: "thunderously discreet" },
  { name: "Anonymous Anubis", emoji: "🐕", accent: "#3B3B58", tagline: "weighing gifts, not hearts" },
];

export function pickAlias(rng: () => number): Alias {
  return ALIASES[Math.floor(rng() * ALIASES.length)];
}
