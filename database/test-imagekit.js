require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Checking ImageKit Configuration...\n');

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

console.log('Environment Variables:');
console.log(`  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: ${publicKey ? '✅ Set (' + publicKey.substring(0, 20) + '...)' : '❌ Not set'}`);
console.log(`  IMAGEKIT_PRIVATE_KEY: ${privateKey ? '✅ Set (' + privateKey.substring(0, 20) + '...)' : '❌ Not set'}`);
console.log(`  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: ${urlEndpoint ? '✅ Set (' + urlEndpoint + ')' : '❌ Not set'}`);

if (!publicKey || !privateKey || !urlEndpoint) {
    console.log('\n❌ ImageKit is not fully configured!');
    console.log('\nTo fix this:');
    console.log('1. Make sure .env.local has all three ImageKit variables');
    console.log('2. Restart the Next.js dev server');
    process.exit(1);
}

console.log('\n✅ ImageKit configuration looks good!');
console.log('\nTesting ImageKit connection...\n');

const ImageKit = require('imagekit');

const imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint
});

// Test by getting authentication parameters
try {
    const authParams = imagekit.getAuthenticationParameters();
    console.log('✅ ImageKit connection successful!');
    console.log('   Token:', authParams.token.substring(0, 20) + '...');
    console.log('   Expire:', authParams.expire);
    console.log('\n🎉 ImageKit is ready to use!\n');
    process.exit(0);
} catch (error) {
    console.error('❌ ImageKit connection failed:', error.message);
    console.log('\nPlease check your ImageKit credentials.\n');
    process.exit(1);
}
