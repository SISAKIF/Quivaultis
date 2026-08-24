import { useEffect, useMemo, useState } from "react";
import "../styles/store.css";
import { getToken } from "../utils/authStore";

function escapeXml(v) {
  return String(v || "Game")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function coverSvg(title, genre, c1 = "#06b6d4", c2 = "#7c3aed") {
  const safeTitle = escapeXml(title);
  const safeGenre = escapeXml(genre || "Game");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="900" height="520" rx="28" fill="#0b1120"/>
      <rect x="18" y="18" width="864" height="484" rx="24" fill="url(#g)" opacity="0.92"/>
      <circle cx="760" cy="110" r="120" fill="rgba(255,255,255,0.08)"/>
      <circle cx="150" cy="420" r="150" fill="rgba(255,255,255,0.06)"/>
      <text x="52" y="120" fill="#e5f7ff" font-size="22" font-family="Arial" font-weight="700">${safeGenre}</text>
      <text x="52" y="220" fill="#ffffff" font-size="46" font-family="Arial" font-weight="900">${safeTitle}</text>
      <text x="52" y="280" fill="#dbeafe" font-size="18" font-family="Arial">Online Gaming Shop</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getGameImage(game) {
  if (game?.image && String(game.image).trim() !== "") {
    return game.image;
  }

  const c1 = game?.colors?.[0] || "#06b6d4";
  const c2 = game?.colors?.[1] || "#7c3aed";
  return coverSvg(game?.title, game?.genre, c1, c2);
}

function handleImageError(e, game) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = coverSvg(game?.title, game?.genre);
}

function finalPrice(game) {
  return +(Number(game.basePrice || 0) * (1 - Number(game.discount || 0) / 100)).toFixed(2);
}

function money(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function Store() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [playtime, setPlaytime] = useState("All");
  const [price, setPrice] = useState("All");
  const [discount, setDiscount] = useState("All");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [cartOpen, setCartOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("store_cart") || "[]");
    } catch {
      return [];
    }
  });

  const [compareIds, setCompareIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("store_compare") || "[]");
    } catch {
      return [];
    }
  });

  const [ownedIds, setOwnedIds] = useState([]);
  const token = getToken();

  useEffect(() => {
    localStorage.setItem("store_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("store_compare", JSON.stringify(compareIds));
  }, [compareIds]);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/store/games");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load games");
      }

      const formattedGames = Array.isArray(data)
        ? data.map((game) => ({
            ...game,
            id: game._id,
            image: getGameImage(game),
          }))
        : [];

      setGames(formattedGames);
    } catch (err) {
      setError(err.message || "Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const loadOwnedGames = async () => {
    try {
      if (!token) return;

      const res = await fetch("/api/store/owned", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load owned games");
      }

      const ids = Array.isArray(data.ownedGames)
        ? data.ownedGames.map((game) => String(game._id))
        : [];

      setOwnedIds(ids);
    } catch (err) {
      console.error("Owned games load error:", err.message);
    }
  };

  useEffect(() => {
    loadGames();
    loadOwnedGames();
  }, []);

  const genres = useMemo(() => ["All", ...new Set(games.map((g) => g.genre))], [games]);
  const playtimes = useMemo(() => ["All", ...new Set(games.map((g) => g.playtime))], [games]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const cartTotals = useMemo(() => {
    let total = 0;
    let saved = 0;

    cart.forEach((item) => {
      const game = games.find((g) => g.id === item.id);
      if (!game) return;

      total += item.price * item.qty;
      saved += (game.basePrice - item.price) * item.qty;
    });

    return {
      total: +total.toFixed(2),
      saved: +saved.toFixed(2),
    };
  }, [cart, games]);

  const compareGames = useMemo(() => {
    return compareIds.map((id) => games.find((g) => g.id === id)).filter(Boolean);
  }, [compareIds, games]);

  const filteredGames = useMemo(() => {
    let list = [...games];

    if (search.trim()) {
      list = list.filter((game) =>
        game.title.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    if (genre !== "All") list = list.filter((game) => game.genre === genre);
    if (playtime !== "All") list = list.filter((game) => game.playtime === playtime);
    if (price !== "All") list = list.filter((game) => finalPrice(game) <= Number(price));
    if (discount !== "All") list = list.filter((game) => game.discount >= Number(discount));

    return list;
  }, [games, search, genre, playtime, price, discount]);

  const resetFilters = () => {
    setSearch("");
    setGenre("All");
    setPlaytime("All");
    setPrice("All");
    setDiscount("All");
    setMessage("");
    setError("");
  };

  const addToCart = (game) => {
    setError("");
    setMessage("");

    setCart((prev) => {
      const existing = prev.find((item) => item.id === game.id);

      if (existing) {
        return prev.map((item) =>
          item.id === game.id ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prev,
        {
          id: game.id,
          title: game.title,
          price: finalPrice(game),
          image: getGameImage(game),
          genre: game.genre,
          qty: 1,
        },
      ];
    });

    setMessage(`${game.title} added to cart.`);
  };

  const cartInc = (id) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item))
    );
  };

  const cartDec = (id) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const cartRemove = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setMessage("Cart cleared.");
    setError("");
  };

  const openDetails = (game) => {
    setSelectedGame(game);
    setDetailsOpen(true);
    setMessage("");
    setError("");
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedGame(null);
  };

  const addSelectedToCart = () => {
    if (!selectedGame) return;
    addToCart(selectedGame);
  };

  const buyNowSelected = () => {
    if (!selectedGame) return;
    addToCart(selectedGame);
    setDetailsOpen(false);
    setCartOpen(true);
  };

  const toggleCompare = (game) => {
    setMessage("");
    setError("");

    setCompareIds((prev) => {
      if (prev.includes(game.id)) {
        return prev.filter((id) => id !== game.id);
      }

      if (prev.length >= 2) {
        setMessage("You can compare only 2 games.");
        return prev;
      }

      return [...prev, game.id];
    });
  };

  const clearCompare = () => {
    setCompareIds([]);
    setCompareOpen(false);
    setMessage("Compare cleared.");
  };

  const openCompare = () => {
    if (compareIds.length !== 2) {
      setMessage("Select exactly 2 games to compare.");
      return;
    }

    setCompareOpen(true);
  };

  const checkoutReal = async () => {
    try {
      setMessage("");
      setError("");

      if (!token) {
        setError("Please login first.");
        return;
      }

      if (cart.length === 0) {
        setError("Cart is empty.");
        return;
      }

      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            qty: item.qty,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Checkout failed");
      }

      const boughtIds = cart.map((item) => item.id);

      setOwnedIds((prev) => Array.from(new Set([...prev, ...boughtIds])));
      setCart([]);
      setCartOpen(false);
      setMessage("Checkout complete. Games added to your account.");

      await loadOwnedGames();
    } catch (err) {
      setError(err.message || "Checkout failed");
    }
  };

  return (
    <section id="section-store" className="app-section store-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">🛍️ Game Store</h1>
          <p className="page-sub">Browse games, filter, compare, and buy from your store.</p>
        </div>

        <div className="head-actions">
          <button className="ghost-btn" type="button" onClick={resetFilters}>
            Reset Filters
          </button>

          <button className="ghost-btn" type="button" onClick={() => setCartOpen(true)}>
            🧾 Cart <span id="cartCountBadge" className="pill-badge">{cartCount}</span>
          </button>

          <button className="primary-btn" type="button" onClick={openCompare}>
            Compare Selected ({compareIds.length}/2)
          </button>
        </div>
      </header>

      {message && <div style={{ color: "#00e676", marginBottom: "16px" }}>{message}</div>}
      {error && <div style={{ color: "#ff6b6b", marginBottom: "16px" }}>{error}</div>}

      <section className="card filters-card">
        <div className="filters-grid">
          <div className="field wide">
            <label>Search</label>
            <div className="input-wrap">
              <span className="icon">🔎</span>
              <input
                type="text"
                placeholder="Search games by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {genres.map((g) => (
                <option key={g} value={g}>{g === "All" ? "All Genres" : g}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Playtime</label>
            <select value={playtime} onChange={(e) => setPlaytime(e.target.value)}>
              {playtimes.map((p) => (
                <option key={p} value={p}>{p === "All" ? "All Playtime" : p}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Max Price</label>
            <select value={price} onChange={(e) => setPrice(e.target.value)}>
              <option value="All">Any Price</option>
              <option value="20">Under $20</option>
              <option value="40">Under $40</option>
              <option value="60">Under $60</option>
              <option value="80">Under $80</option>
            </select>
          </div>

          <div className="field">
            <label>Discount</label>
            <select value={discount} onChange={(e) => setDiscount(e.target.value)}>
              <option value="All">Any Discount</option>
              <option value="10">10%+ Off</option>
              <option value="20">20%+ Off</option>
              <option value="30">30%+ Off</option>
              <option value="50">50%+ Off</option>
            </select>
          </div>
        </div>
      </section>

      <section id="gameGrid" className="game-grid">
        {loading ? (
          <div className="card"><b>Loading games...</b></div>
        ) : filteredGames.length === 0 ? (
          <div className="card">
            <b>No games found.</b>
            <div className="tiny muted">Try Reset Filters.</div>
          </div>
        ) : (
          filteredGames.map((game) => {
            const selectedForCompare = compareIds.includes(game.id);
            const owned = ownedIds.includes(game.id);

            return (
              <div key={game.id} className="game-card">
                <img
                  src={getGameImage(game)}
                  alt={game.title}
                  onError={(e) => handleImageError(e, game)}
                />

                <div className="content">
                  <h3>{game.title}</h3>

                  <div className="meta-row">
                    <span className="badge">{game.genre}</span>
                    <span className="badge">⭐ {game.rating}</span>
                    <span className="badge">{game.playtime}</span>

                    {owned && (
                      <span
                        className="badge"
                        style={{
                          borderColor: "rgba(0,230,118,.45)",
                          background: "rgba(0,230,118,.14)",
                          color: "#d6ffe9",
                        }}
                      >
                        Owned
                      </span>
                    )}
                  </div>

                  <div className="price-row">
                    <div className="price">
                      {money(finalPrice(game))}
                      {game.discount > 0 && (
                        <span
                          className="tiny muted"
                          style={{ marginLeft: "8px", textDecoration: "line-through" }}
                        >
                          {money(game.basePrice)}
                        </span>
                      )}
                    </div>

                    {game.discount > 0 ? (
                      <div className="discount">-{game.discount}%</div>
                    ) : (
                      <div className="tiny muted">No discount</div>
                    )}
                  </div>

                  <div className="card-actions">
                    <button className="details-btn" type="button" onClick={() => openDetails(game)}>
                      Details
                    </button>

                    <button className="compare-btn" type="button" onClick={() => toggleCompare(game)}>
                      {selectedForCompare ? "Selected" : "Compare"}
                    </button>

                    <button className="cart-mini-btn" type="button" onClick={() => addToCart(game)}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <div className={`compare-bar ${compareIds.length > 0 ? "" : "hidden"}`}>
        <div className="compare-left">
          <span className="compare-title">⚔️ Compare</span>
          <span className="compare-count">{compareIds.length}/2 selected</span>
          <span className="compare-items">
            {compareGames.map((game) => game.title).join(" vs ")}
          </span>
        </div>

        <div className="compare-right">
          <button className="ghost-btn" type="button" onClick={clearCompare}>Clear</button>
          <button className="primary-btn" type="button" onClick={openCompare}>Compare Now</button>
        </div>
      </div>

      <div className={`gs-modal ${detailsOpen ? "show" : ""}`} aria-hidden={!detailsOpen}>
        <div className="gs-modal-panel" role="dialog" aria-modal="true">
          <div className="gs-modal-head">
            <h3 className="gs-modal-title">{selectedGame?.title || "Game"}</h3>
            <button className="gs-modal-close" type="button" onClick={closeDetails}>✕</button>
          </div>

          <div className="gs-modal-body">
            {selectedGame && (
              <div className="gs-detail-grid">
                <div className="gs-detail-left">
                  <img
                    src={getGameImage(selectedGame)}
                    className="gs-detail-img"
                    alt={selectedGame.title}
                    onError={(e) => handleImageError(e, selectedGame)}
                  />
                </div>

                <div className="gs-detail-right">
                  <div className="gs-kv-grid">
                    <div className="gs-kv">
                      <span>Price</span>
                      <b>{money(finalPrice(selectedGame))}</b>
                      <small>
                        {selectedGame.discount > 0 ? `Was ${money(selectedGame.basePrice)}` : ""}
                      </small>
                    </div>

                    <div className="gs-kv">
                      <span>Discount</span>
                      <b>{selectedGame.discount > 0 ? `-${selectedGame.discount}%` : "—"}</b>
                    </div>

                    <div className="gs-kv">
                      <span>Rating</span>
                      <b>⭐ {selectedGame.rating}</b>
                    </div>

                    <div className="gs-kv">
                      <span>Playtime</span>
                      <b>{selectedGame.playtime}</b>
                    </div>
                  </div>

                  <div className="gs-warning">
                    {ownedIds.includes(selectedGame.id)
                      ? "✅ You already own this game."
                      : selectedGame.description}
                  </div>

                  <div className="gs-subhead">Who is this game for?</div>

                  <div className="gs-tags">
                    {selectedGame.tags?.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <div className="gs-divider"></div>

                  <div className="gs-actions">
                    <button className="primary-btn" type="button" onClick={buyNowSelected}>
                      🛒 Buy Now
                    </button>

                    <button className="ghost-btn" type="button" onClick={addSelectedToCart}>
                      ➕ Add to Cart
                    </button>

                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => {
                        setDetailsOpen(false);
                        setCartOpen(true);
                      }}
                    >
                      🧾 View Cart
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`gs-modal ${compareOpen ? "show" : ""}`} aria-hidden={!compareOpen}>
        <div className="gs-modal-panel gs-compare-panel" role="dialog" aria-modal="true">
          <div className="gs-modal-head">
            <h3 className="gs-modal-title">⚔️ Compare Games</h3>

            <div className="gs-head-actions">
              <button className="ghost-btn" type="button" onClick={clearCompare}>Clear</button>
              <button className="gs-modal-close" type="button" onClick={() => setCompareOpen(false)}>
                ✕
              </button>
            </div>
          </div>

          <div className="gs-modal-body">
            <div className="gs-compare-grid">
              {compareGames.map((game) => (
                <div key={game.id} className="gs-compare-card">
                  <img
                    src={getGameImage(game)}
                    alt={game.title}
                    onError={(e) => handleImageError(e, game)}
                  />

                  <div className="gs-compare-body">
                    <h4>{game.title}</h4>

                    <div className="gs-row"><span>Genre</span><b>{game.genre}</b></div>
                    <div className="gs-row"><span>Playtime</span><b>{game.playtime}</b></div>
                    <div className="gs-row"><span>Difficulty</span><b>{game.difficulty}</b></div>
                    <div className="gs-row"><span>Rating</span><b>⭐ {game.rating}</b></div>
                    <div className="gs-row"><span>Discount</span><b>{game.discount}%</b></div>
                    <div className="gs-row"><span>Final Price</span><b>{money(finalPrice(game))}</b></div>
                    <div className="gs-row"><span>Tags</span><b>{game.tags?.join(", ")}</b></div>

                    <div className="btn-row" style={{ marginTop: "12px" }}>
                      <button className="ghost-btn" type="button" onClick={() => openDetails(game)}>
                        Details
                      </button>
                      <button className="primary-btn" type="button" onClick={() => addToCart(game)}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`gs-modal ${cartOpen ? "show" : ""}`} aria-hidden={!cartOpen}>
        <div className="gs-modal-panel gs-cart-panel" role="dialog" aria-modal="true">
          <div className="gs-modal-head">
            <h3 className="gs-modal-title">
              🧾 Your Cart <span className="pill-badge">{cartCount}</span>
            </h3>
            <button className="gs-modal-close" type="button" onClick={() => setCartOpen(false)}>
              ✕
            </button>
          </div>

          <div className="gs-modal-body">
            <div className="gs-cart-list">
              {cart.length === 0 ? (
                <div className="card">
                  <b>Your cart is empty.</b>
                  <div className="tiny muted">Add a game from store.</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="gs-cart-item">
                    <img
                      src={item.image || coverSvg(item.title, item.genre)}
                      alt={item.title}
                      onError={(e) => handleImageError(e, item)}
                    />

                    <div className="gs-cart-main">
                      <h4>{item.title}</h4>
                      <div className="gs-cart-sub">{item.genre}</div>
                      <div className="gs-cart-sub">
                        Price: <b>{money(item.price)}</b>
                      </div>
                    </div>

                    <div className="gs-cart-right">
                      <div className="gs-stepper">
                        <button type="button" onClick={() => cartDec(item.id)}>−</button>
                        <b>{item.qty}</b>
                        <button type="button" onClick={() => cartInc(item.id)}>+</button>
                      </div>

                      <button className="ghost-btn" type="button" onClick={() => cartRemove(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="gs-cart-foot">
              <div className="gs-total">
                <div className="tiny muted">Total</div>
                <div className="gs-total-value">{money(cartTotals.total)}</div>
                <div className="tiny muted">
                  {cartTotals.saved > 0 ? `You saved ${money(cartTotals.saved)}` : ""}
                </div>
              </div>

              <div className="btn-row">
                <button className="ghost-btn" type="button" onClick={clearCart}>Clear</button>
                <button className="ghost-btn" type="button" onClick={() => setCartOpen(false)}>Continue</button>
                <button className="primary-btn" type="button" onClick={checkoutReal}>Checkout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}