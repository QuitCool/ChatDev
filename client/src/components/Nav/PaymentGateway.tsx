// PaymentGateway.tsx
import { useAuthContext } from '../../hooks/AuthContext'; 

const apiKey = 'ZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKSVV6VXhNaUo5LmV5SndjbTltYVd4bFgzQnJJam95TXpFM05UQXNJbTVoYldVaU9pSnBibWwwYVdGc0lpd2lZMnhoYzNNaU9pSk5aWEpqYUdGdWRDSjkuMFp0NmVhYjlQUzFWX3hQdXNNNkNvcm1EY0tZZEVST0RKNExoZ3ZXekQyR3hLTFhJUXNVNkNoXzkzcVdDS3p2cWpsRUNXcTg5V0k1LVNlOWQxNlpSR2c='; // replace with your actual key

const items = [
  {
    name: "1 Month Subscription",
    amount_cents: "38000", // 380 EGP in cents
    description: "1 month subscription",
    quantity: "1"
  },
  {
    name: "2 Months Subscription",
    amount_cents: "67000", // 670 EGP in cents
    description: "2 months subscription",
    quantity: "1"
  },
  {
    name: "3 Months Subscription",
    amount_cents: "86000", // 860 EGP in cents
    description: "3 months subscription",
    quantity: "1"
  }
];

export const useProcessPayment = () => {
    const { user } = useAuthContext();
  
    const processPayment = async () => {
      if (!user) {
        throw new Error('User data is not available');
      }
      // Log the user data to the console
      console.log(user);
      const billingData = {
        apartment: "NA", 
        email: user.email, // Use the user's email
        floor: "NA", 
        first_name: user.name, // Use the user's first name
        street: "NA", 
        building: "NA", 
        phone_number: "01000000000", // Use the user's phone number
        shipping_method: "NA", 
        postal_code: "NA", 
        city: "NA", 
        country: "NA", 
        last_name: user.name, // Use the user's last name
        state: "NA"
      };
  
  const processPayment = async () => {
    // Step 1: Authentication Request
    const response = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
      }),
    });

    const data = await response.json();
    const authToken = data.token;

    // Step 2: Order Registration API
    const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: "100",
        currency: "EGP",
        merchant_order_id: 5,
        items: items,
        billing_data: billingData,
        // add other necessary fields
      }),
    });

    const orderData = await orderResponse.json();
    const orderId = orderData.id;

    // Step 3: Payment Key Request
    const paymentResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: "100",
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: "EGP",
        integration_id: 1,
        lock_order_when_paid: "false",
      }),
    });

    const paymentData = await paymentResponse.json();
    const paymentKey = paymentData.token;

    // Now you can use the paymentKey to initiate the payment
    return paymentKey;
  };

    // Step 4: Mobile Wallet Payment
    const walletResponse = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          identifier: "01010101011", // replace with the actual mobile number
          subtype: "WALLET"
        },
        payment_token: paymentKey, // the payment token obtained in step 3
      }),
    });

    const walletData = await walletResponse.json();
    const redirectUrl = walletData.redirect_url;

    // Now you can redirect the user to the redirectUrl to complete the payment
    return redirectUrl;
  };

  return { processPayment };
};