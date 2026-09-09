const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const testCases = [
  { email: '[REDACTED_EMAIL_ADDRESS_1]', password: 'Admin@1234' },
  { email: '[REDACTED_EMAIL_ADDRESS_7]', password: 'Test@1234' },
  { email: 'hello@gmail.com', password: 'Test@1234' },
];

testCases.forEach(tc => {
  const result = loginSchema.safeParse(tc);
  console.log(tc.email, '->', result.success ? 'PASS' : JSON.stringify(result.error.flatten().fieldErrors));
});
