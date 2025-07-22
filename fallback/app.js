// People Register Frontend - Fallback Build JavaScript
// This script provides basic functionality for the fallback build page

console.log('🎨 People Register Frontend - Fallback Build');
console.log('⚠️ This is a fallback build due to Node.js version compatibility');
console.log('🔧 Check CI logs for detailed version information');

// Add build information to the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Fallback page loaded successfully');
    
    // Add current timestamp
    const footer = document.querySelector('.footer');
    if (footer) {
        const timestamp = document.createElement('p');
        timestamp.innerHTML = `<strong>Generated:</strong> ${new Date().toISOString()}`;
        footer.appendChild(timestamp);
    }
    
    // Add some interactivity to demonstrate JavaScript is working
    const statusElements = document.querySelectorAll('.status');
    statusElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.1}s`;
        element.classList.add('fade-in');
    });
    
    // Log environment information
    console.log('🌐 Environment Information:');
    console.log(`  User Agent: ${navigator.userAgent}`);
    console.log(`  Language: ${navigator.language}`);
    console.log(`  Platform: ${navigator.platform}`);
    console.log(`  Viewport: ${window.innerWidth}x${window.innerHeight}`);
    
    // Simulate some of the functionality that would be in the real app
    console.log('🚀 Simulated App Features:');
    console.log('  - People management system');
    console.log('  - React components with state management');
    console.log('  - API integration with AWS Lambda');
    console.log('  - Real-time form validation');
    console.log('  - Responsive design with Tailwind CSS');
    
    // Add a simple click handler to show interactivity
    document.body.addEventListener('click', function(e) {
        if (e.target.tagName === 'H3') {
            console.log(`📋 Clicked section: ${e.target.textContent}`);
        }
    });
    
    // Performance timing information
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`⚡ Page load time: ${loadTime}ms`);
    }
});

// Add CSS animation class
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: statusFadeIn 0.6s ease-out forwards;
        opacity: 0;
        transform: translateX(-20px);
    }
    
    @keyframes statusFadeIn {
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Export some utility functions that might be useful
window.PeopleRegisterFallback = {
    version: '1.0.0',
    buildType: 'fallback',
    
    getInfo: function() {
        return {
            buildType: this.buildType,
            version: this.version,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
    },
    
    log: function(message) {
        console.log(`[PeopleRegister] ${message}`);
    }
};

// Final initialization
console.log('✅ Fallback build JavaScript initialized successfully');
console.log('🔗 Access build info via: window.PeopleRegisterFallback.getInfo()');
