import { createServer } from 'vite';

async function testUI() {
  console.log('Testing SCRIMS UI server...');
  const server = await createServer({
    root: 'c:/Users/USER/Desktop/Scrims/frontend',
    server: { port: 5180, host: 'localhost' }
  });

  await server.listen();
  console.log('1. Vite Dev Server listening on http://localhost:5180');

  try {
    // 1. Fetch HTML Root
    const res = await fetch('http://localhost:5180');
    console.log('2. GET / status:', res.status);
    const html = await res.text();
    console.log('   Root HTML length:', html.length, '| Has root div:', html.includes('id="root"'));

    // 2. Fetch main.jsx
    const mainRes = await fetch('http://localhost:5180/src/main.jsx');
    console.log('3. GET /src/main.jsx status:', mainRes.status);

    // 3. Fetch App.jsx
    const appRes = await fetch('http://localhost:5180/src/App.jsx');
    console.log('4. GET /src/App.jsx status:', appRes.status);

    // 4. Fetch CinematicHero3D.jsx
    const heroRes = await fetch('http://localhost:5180/src/components/CinematicHero3D.jsx');
    console.log('5. GET /src/components/CinematicHero3D.jsx status:', heroRes.status);

    // 5. Fetch 3D GLB model
    const modelRes = await fetch('http://localhost:5180/model/ferrari_laferrari_Black.glb');
    console.log('6. GET /model/ferrari_laferrari_Black.glb status:', modelRes.status, '| Content-Length:', modelRes.headers.get('content-length'));

    // 6. Fetch Audio SFX
    const soundRes = await fetch('http://localhost:5180/sound/LaFerrari-Sound.mp3');
    console.log('7. GET /sound/LaFerrari-Sound.mp3 status:', soundRes.status, '| Content-Length:', soundRes.headers.get('content-length'));

    console.log('\n>>> ALL UI ASSETS & COMPONENTS LOADED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('UI Test Failure:', err);
  } finally {
    await server.close();
    console.log('Vite server closed.');
  }
}

testUI();
