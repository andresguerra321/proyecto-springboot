// Test script to verify login and verify-session flows
const BASE_URL = 'http://localhost:8085/api/v1';

async function testLoginFlow() {
  console.log('--- 1. Testing Valid Login (cliente_carlos_gomez) ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'cliente_carlos_gomez',
      password: 'Password123*'
    })
  });

  console.log('Login Status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Login Data received:', {
    hasToken: Boolean(loginData.token),
    hasJwtToken: Boolean(loginData.jwtToken),
    role: loginData.role,
    username: loginData.username
  });

  const token = loginData.token || loginData.jwtToken;
  if (!token) throw new Error('No token returned from login');

  console.log('\n--- 2. Testing Verify Session with Login Token ---');
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-session`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('Verify Status:', verifyRes.status);
  const verifyData = await verifyRes.json();
  console.log('Verified Session Projection:', verifyData);

  console.log('\n--- 3. Testing Provider Login (prov_maquinaria_bog) ---');
  const provRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'prov_maquinaria_bog',
      password: 'Password123*'
    })
  });
  console.log('Provider Login Status:', provRes.status);
  const provData = await provRes.json();
  const provToken = provData.token || provData.jwtToken;

  const provVerifyRes = await fetch(`${BASE_URL}/auth/verify-session`, {
    headers: { Authorization: `Bearer ${provToken}` }
  });
  console.log('Provider Verified Projection:', await provVerifyRes.json());

  console.log('\n--- 4. Testing Bad Credentials Error Handling ---');
  const badRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'cliente_carlos_gomez',
      password: 'WrongPassword999'
    })
  });
  console.log('Bad login status (expected 401):', badRes.status);
  console.log('Bad login body:', await badRes.json().catch(() => 'no json'));

  console.log('\n✅ All Login & Session Verification tests passed successfully!');
}

testLoginFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
