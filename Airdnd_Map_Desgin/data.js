// Airdnd — sample listings positioned on the faux map plane.
// x / y are percentages within the 1600×1200 map plane.
window.AIRDND_LISTINGS = [
  { id: 1,  name: "Spacious cozy house in Seocho", region: "Seocho-gu, Seoul", price: 82953, rating: 4.92, reviews: 127, guests: 4, beds: 2, type: "Entire home", x: 30, y: 34, available: true, pets: true,  img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" },
  { id: 2,  name: "Designer loft near Gangnam Stn", region: "Gangnam-gu, Seoul", price: 115126, rating: 4.88, reviews: 312, guests: 3, beds: 1, type: "Entire loft", x: 44, y: 28, available: true, pets: false, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80" },
  { id: 3,  name: "Minimal studio with city view", region: "Yeoksam, Seoul", price: 96095, rating: 4.79, reviews: 88, guests: 2, beds: 1, type: "Studio", x: 58, y: 22, available: true, pets: false, img: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=80" },
  { id: 4,  name: "Sunlit apartment by the park", region: "Seocho-gu, Seoul", price: 105260, rating: 4.95, reviews: 204, guests: 5, beds: 2, type: "Entire home", x: 49, y: 38, available: true, pets: true,  img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80" },
  { id: 5,  name: "Warm wood-toned hideaway", region: "Banpo, Seoul", price: 132800, rating: 4.83, reviews: 156, guests: 4, beds: 2, type: "Entire home", x: 52, y: 31, available: false, pets: false, img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80" },
  { id: 6,  name: "Riverside penthouse suite", region: "Yongsan-gu, Seoul", price: 201599, rating: 4.97, reviews: 410, guests: 6, beds: 3, type: "Penthouse", x: 64, y: 56, available: true, pets: false, img: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=600&q=80" },
  { id: 7,  name: "Quiet garden cottage", region: "Seongbuk-gu, Seoul", price: 24956, rating: 4.71, reviews: 42, guests: 2, beds: 1, type: "Private room", x: 75, y: 70, available: true, pets: true,  img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80" },
  { id: 8,  name: "Bright corner flat", region: "Mapo-gu, Seoul", price: 112962, rating: 4.86, reviews: 173, guests: 3, beds: 1, type: "Entire flat", x: 70, y: 74, available: true, pets: false, img: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=600&q=80" },
  { id: 9,  name: "Modern home with terrace", region: "Gangnam-gu, Seoul", price: 143200, rating: 4.9,  reviews: 268, guests: 5, beds: 2, type: "Entire home", x: 38, y: 50, available: true, pets: false, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" },
  { id: 10, name: "Industrial-chic studio", region: "Seongdong-gu, Seoul", price: 78500, rating: 4.74, reviews: 61, guests: 2, beds: 1, type: "Studio", x: 47, y: 60, available: true, pets: false, img: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=600&q=80" },
  { id: 11, name: "Hanok-style courtyard stay", region: "Jongno-gu, Seoul", price: 165400, rating: 4.99, reviews: 521, guests: 6, beds: 3, type: "Entire home", x: 57, y: 47, available: true, pets: false, img: "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=600&q=80" },
  { id: 12, name: "Cozy nook near the market", region: "Jung-gu, Seoul", price: 54900, rating: 4.68, reviews: 39, guests: 2, beds: 1, type: "Private room", x: 28, y: 64, available: true, pets: true,  img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80" },
  { id: 13, name: "Skyline view 2BR", region: "Yeongdeungpo-gu, Seoul", price: 128400, rating: 4.81, reviews: 142, guests: 4, beds: 2, type: "Entire home", x: 22, y: 46, available: true, pets: false, img: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=600&q=80" },
  { id: 14, name: "Boutique room, old town", region: "Jongno-gu, Seoul", price: 67300, rating: 4.77, reviews: 95, guests: 2, beds: 1, type: "Private room", x: 66, y: 38, available: true, pets: false, img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80" },
];

// Pre-computed clusters shown when the map is zoomed out (district level).
window.AIRDND_CLUSTERS = [
  { id: "c1", label: "Gangnam · Seocho", count: 6, min: 82953,  max: 143200, x: 43, y: 34 },
  { id: "c2", label: "Yongsan · Mapo",   count: 4, min: 24956,  max: 201599, x: 68, y: 66 },
  { id: "c3", label: "Jongno · Jung",    count: 4, min: 54900,  max: 165400, x: 44, y: 55 },
];

window.formatKRW = (n) => "₩" + n.toLocaleString("en-US");
window.formatKRWShort = (n) => n >= 1000 ? "₩" + Math.round(n / 1000) + "K" : "₩" + n;
