/**
 * Simple parser test script
 * To run: Copy this and paste it into your browser console while on the app page
 */

// This will use the actual Parser module from the app

// Test function
async function testBeastParser() {
    try {
        // Fetch the beast data
        const response = await fetch('Random 2nd selection of beasts.md');
        const markdown = await response.text();
        
        // Parse the beasts
        const beasts = Parser.parseBeastMarkdown(markdown);
        
        // Log results
        console.log(`Parser found ${beasts.length} beasts`);
        console.log('Beast names:');
        beasts.forEach(beast => {
            console.log(`- ${beast.name} (${beast.size} ${beast.type}, CR ${beast.cr})`);
        });
        
        // Show full data for first beast
        console.log('Sample beast data (first beast):');
        console.log(beasts[0]);
        
        // Return success status
        return {
            success: beasts.length === 5,
            message: beasts.length === 5 ? 
                'SUCCESS: Parser found all 5 beasts!' : 
                `FAILURE: Parser found ${beasts.length} beasts instead of the expected 5`,
            beasts
        };
    } catch (error) {
        console.error('Test error:', error);
        return {
            success: false,
            message: `ERROR: ${error.message}`,
            error
        };
    }
}

// Run the test
testBeastParser().then(result => {
    console.log('TEST RESULT:', result.message);
    
    // Show a notification in the app UI if available
    if (typeof UIUtils !== 'undefined' && UIUtils.showNotification) {
        UIUtils.showNotification(
            result.message, 
            result.success ? 'success' : 'error'
        );
    }
});

// Instructions to run this test:
// 1. Open the app in your browser
// 2. Open the browser developer console (F12)
// 3. Copy and paste this entire file into the console
// 4. Press Enter to run the test
