const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// admin.initializeApp();

// exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
//   try {
//     const { amount } = req.body;

//     if (!amount) {
//       return res.status(400).send({ error: 'Amount is required' });
//     }

//     const customer = await stripe.customers.create();

//     const ephemeralKey = await stripe.ephemeralKeys.create(
//       { customer: customer.id },
//       { apiVersion: '2023-10-16' }
//     );

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount, // en centavos
//       currency: 'usd',
//       customer: customer.id,
//       automatic_payment_methods: { enabled: true },
//     });

//     res.status(200).send({
//       paymentIntent: paymentIntent.client_secret,
//       ephemeralKey: ephemeralKey.secret,
//       customer: customer.id,
//     });
//   } catch (error) {
//     console.error('Error en createPaymentIntent:', error);
//     res.status(500).send({ error: error.message });
//   }
// });
admin.initializeApp();

exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  try {
    const { amount, customerId } = req.body;

    if (!amount) {
      return res.status(400).send({ error: "Amount is required" });
    }

    let customer = null;

    if (customerId) {
      // Usar el customerId proporcionado
      customer = await stripe.customers.retrieve(customerId);
    } else {
      // Si no se proporciona customerId, creamos uno nuevo
      customer = await stripe.customers.create();
    }

    // Crear ephemeralKey para ese customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" },
    );

    // Crear PaymentIntent asociado al customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    // Enviar info al frontend
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
