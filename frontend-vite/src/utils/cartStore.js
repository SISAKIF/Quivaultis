const CART_KEY = "game_store_cart";

export const getCart = () => {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
};

export const addToCart = (game) => {
  const cart = getCart();
  const existing = cart.find((item) => item.id === game.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...game, qty: 1 });
  }

  saveCart(cart);
};

export const removeFromCart = (id) => {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
};

export const updateCartQty = (id, qty) => {
  const cart = getCart()
    .map((item) =>
      item.id === id ? { ...item, qty: qty < 1 ? 1 : qty } : item
    );
  saveCart(cart);
};

export const clearCart = () => {
  saveCart([]);
};

export const getCartCount = () => {
  return getCart().reduce((total, item) => total + item.qty, 0);
};

export const getCartSubtotal = () => {
  return getCart().reduce((total, item) => total + item.price * item.qty, 0);
};