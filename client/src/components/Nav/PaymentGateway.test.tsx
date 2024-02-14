import { renderHook } from '@testing-library/react-hooks';
import { useAuthContext } from '../../hooks/AuthContext'; // Replace with the actual path to your auth context
import { useProcessPayment } from './PaymentGateway';

jest.mock('path/to/auth-context'); // Replace with the actual path to your auth context

describe('useProcessPayment', () => {
  const user = {
    email: 'test@test.com',
    name: 'John Doe',
  };

  beforeEach(() => {
    useAuthContext.mockReturnValue({ user });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns a function called processPayment', () => {
    const { result } = renderHook(() => useProcessPayment());

    expect(result.current.processPayment).toBeDefined();
    expect(typeof result.current.processPayment).toBe('function');
  });

  test('calls the necessary APIs and returns the payment key', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    const authToken = 'mock-auth-token';
    const orderId = 'mock-order-id';
    const paymentKey = 'mock-payment-key';

    fetchMock
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ token: authToken }),
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ id: orderId }),
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ token: paymentKey }),
      });

    const { result } = renderHook(() => useProcessPayment());

    const { processPayment } = result.current;
    const paymentKeyResult = await processPayment();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: expect.any(String), // Replace with the actual API key
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: '100',
        currency: 'EGP',
        merchant_order_id: 5,
        items: expect.any(Array), // Replace with the actual items
        billing_data: expect.any(Object), // Replace with the actual billing data
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: '100',
        expiration: 3600,
        order_id: orderId,
        billing_data: expect.any(Object), // Replace with the actual billing data
        currency: 'EGP',
        integration_id: 1,
        lock_order_when_paid: 'false',
      }),
    });

    expect(paymentKeyResult).toBe(paymentKey);
  });
});