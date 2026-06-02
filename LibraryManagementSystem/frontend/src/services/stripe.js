import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  "pk_test_51TZd5QJEMdyAWKptfQ7r3M4wkCFxRcux4grSuRoy4VMdqZf5MNaanS9CjRv8pLKMo7DJQPNjtefUjSdWHJBSUwEL007EVvvhVW"
);