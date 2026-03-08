const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  // Permite CORS para desarrollo
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  try {
    const { amount, customerId, userId } = req.body;

    if (!amount) {
      return res.status(400).send({ error: "Amount is required" });
    }

    let customer;

    if (customerId) {
      // ── Usuario ya tiene customer en Stripe → reutilizarlo ────────────
      try {
        customer = await stripe.customers.retrieve(customerId);
        // Si fue eliminado en Stripe, crear uno nuevo
        if (customer.deleted) throw new Error("Customer deleted");
      } catch {
        customer = await stripe.customers.create();
      }
    } else {
      // ── Primera compra → crear customer nuevo en Stripe ───────────────
      customer = await stripe.customers.create();

      // ✅ CLAVE: guardar el customerId en Firestore para futuras compras
      // Así la próxima vez el frontend lo envía y reutilizamos el mismo customer
      if (userId) {
        await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .update({ stripeCustomerId: customer.id });
      }
    }

    // Ephemeral key — permite al Payment Sheet leer/guardar métodos de pago
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" },
    );

    // PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "jpy", // ✅ Yen japonés (sin decimales)
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      // Guardar el método de pago para futuras compras
      setup_future_usage: "off_session",
    });

    res.status(200).send({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (error) {
    console.error("Error en createPaymentIntent:", error);
    res.status(500).send({ error: error.message });
  }
});
