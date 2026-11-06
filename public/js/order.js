const STATUS_LABELS = {
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const orderId = new URLSearchParams(location.search).get("id");
const statusEl = document.querySelector("#status");
const detailsEl = document.querySelector("#details");
const logEl = document.querySelector("#log");

function render(order) {
  document.querySelector("#order-id").textContent = `#${order.id}`;
  statusEl.textContent = STATUS_LABELS[order.status];
  detailsEl.textContent = `Produit ${order.productId} × ${order.quantity}, passée le ${new Date(order.createdAt).toLocaleString("fr-FR")}`;
}

function log(text) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString("fr-FR")} : ${text}`;
  logEl.append(li);
}

async function start() {
  if (!orderId) {
    statusEl.textContent = "aucune commande, ajoutez ?id=1 à l'URL";
    return;
  }

  const res = await fetch(`/orders/${orderId}`);
  if (!res.ok) {
    statusEl.textContent = (await res.json()).error;
    return;
  }
  render(await res.json());

  const source = new EventSource(`/orders/${orderId}/events`);
  for (const event of ["order-status-changed", "order-cancelled"]) {
    source.addEventListener(event, (e) => {
      const order = JSON.parse(e.data);
      render(order);
      log(`${event} → ${STATUS_LABELS[order.status]}`);
      if (order.status === "delivered" || order.status === "cancelled") {
        source.close();
        log("suivi terminé");
      }
    });
  }
  source.onerror = () => {
    if (source.readyState === EventSource.CLOSED) log("suivi terminé");
    else log("connexion perdue, reconnexion dans 5 s…");
  };
  window.addEventListener("pagehide", () => source.close());
}

start();
