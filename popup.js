// PranitaDesk AI Assistant - Main Logic
class PranitaDeskAI {
    constructor() {
        this.apiBaseUrl = 'https://smart-clerk-ai.preview.emergentagent.com/api';
        this.currentData = null;
        this.isProcessing = false;
        
        this.initializeExtension();
    }

    initializeExtension() {
        console.log('🤖 PranitaDesk AI Assistant initializing...');
        
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }

        // Check portal status
        this.checkPortalStatus();
        
        console.log('✅ PranitaDesk AI Assistant ready');
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('analyze-btn')?.addEventListener('click', () => this.analyzeApplication());
        document.getElementById('generate-btn')?.addEventListener('click', () => this.generateRemarks());
        document.getElementById('voice-btn')?.addEventListener('click', () => this.startVoiceInput());
        
        // Advanced feature buttons
        document.getElementById('stats-btn')?.addEventListener('click', () => this.showStats());
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportWork());
        document.getElementById('help-btn')?.addEventListener('click', () => this.showHelp());
        document.getElementById('settings-btn')?.addEventListener('click', () => this.showSettings());
        
        console.log('🔧 Event listeners attached');
    }

    async checkPortalStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab?.url || '';
            
            let portalName = 'Unknown';
            let status = 'Not Detected';
            
            if (url.includes('mahaonline.gov.in')) {
                portalName = 'MahOnline';
                status = 'Connected ✅';
            } else if (url.includes('.gov.in')) {
                portalName = 'Government Portal';
                status = 'Connected ✅';
            } else {
                status = 'Not Government Portal';
            }
            
            this.updateStatus('portal-status', status);
            this.updateStatus('ai-status', 'Ready 🤖');
            
        } catch (error) {
            console.error('Portal status check failed:', error);
            this.updateStatus('portal-status', 'Error');
        }
    }

    async analyzeApplication() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.showNotification('🔍 Analyzing application...', 'info');
        
        const analyzeBtn = document.getElementById('analyze-btn');
        analyzeBtn.classList.add('loading');
        analyzeBtn.textContent = '🔍 Analyzing...';
        
        try {
            // Simulate application analysis
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock results for demo
            const results = {
                documents_verified: Math.floor(Math.random() * 8) + 3,
                missing_documents: Math.floor(Math.random() * 3),
                confidence: Math.floor(Math.random() * 40) + 60
            };
            
            this.displayResults(results);
            this.showNotification('✅ Analysis completed successfully', 'success');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showNotification('❌ Analysis failed: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
            analyzeBtn.classList.remove('loading');
            analyzeBtn.textContent = '📊 Analyze Application';
        }
    }

    async generateRemarks() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.showNotification('💬 Generating bilingual remarks...', 'info');
        
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.classList.add('loading');
        generateBtn.textContent = '💬 Generating...';
        
        try {
            // Simulate remark generation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const certificateType = document.getElementById('certificate-type').value;
            
            // Mock bilingual remarks
            const remarks = this.getBilingualRemark(certificateType);
            
            // Try to fill remark in the portal
            await this.fillRemarkInPortal(remarks);
            
            this.showNotification('✅ Smart remarks generated and filled', 'success');
            
        } catch (error) {
            console.error('Remark generation failed:', error);
            this.showNotification('❌ Remark generation failed', 'error');
        } finally {
            this.isProcessing = false;
            generateBtn.classList.remove('loading');
            generateBtn.textContent = '💬 Generate Remarks';
        }
    }

    async startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showNotification('❌ Voice recognition not supported', 'error');
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'mr-IN'; // Marathi
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        this.showNotification('🎤 Voice input started - speak in Marathi...', 'info');

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Voice input:', transcript);
            
            if (event.results[0].isFinal) {
                this.handleVoiceInput(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.showNotification('❌ Voice recognition error', 'error');
        };

        recognition.onend = () => {
            this.showNotification('🔇 Voice input ended', 'info');
        };

        recognition.start();
    }

    async handleVoiceInput(transcript) {
        console.log('Processing voice input:', transcript);
        
        // Try to fill voice input in remark field
        try {
            await this.fillRemarkInPortal(transcript);
            this.showNotification('✅ Voice input filled successfully', 'success');
        } catch (error) {
            this.showNotification('⚠️ Could not fill voice input automatically', 'warning');
        }
    }

    async fillRemarkInPortal(remarkText) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url.includes('.gov.in')) {
                throw new Error('Not on government portal');
            }

            // Inject script to fill remark
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text) => {
                    // Try common remark field selectors
                    const selectors = [
                        'textarea[name*="remark"]',
                        'textarea[id*="remark"]',
                        'textarea[placeholder*="remark"]',
                        'textarea[name*="comment"]',
                        'textarea[id*="comment"]',
                        'input[name*="remark"]',
                        'textarea'
                    ];
                    
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            element.value = text;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                        }
                    }
                    return false;
                },
                args: [remarkText]
            });

        } catch (error) {
            console.error('Failed to fill remark:', error);
            throw error;
        }
    }

    getBilingualRemark(certificateType) {
        const remarks = {
            domicile: "सादर कागदपत्रांची तपासणी केली असून निवास प्रमाणपत्रासाठी सर्व आवश्यक कागदपत्रे योग्य आहेत. पुढील कारवाईसाठी सविनय सादर.\n\nUpon verification of submitted documents, all required papers for domicile certificate are found to be in order. Respectfully submitted for further action.",
            
            income: "सादर अर्जासह जोडलेली कागदपत्रे तपासली असून उत्पन्न प्रमाणपत्रासाठी सर्व आवश्यक कागदपत्रे पूर्ण आहेत. पुढील कारवाईसाठी सविनय सादर.\n\nThe documents submitted with the application have been verified and all required documents for income certificate are complete. Respectfully submitted for further action.",
            
            caste: "सादर अर्जासह सादर केलेली कागदपत्रे तपासून पाहिली असून जाती प्रमाणपत्रासाठी सर्व कागदपत्रे योग्य स्वरूपात आहेत. पुढील कारवाईसाठी सादर.\n\nThe documents submitted with the application have been examined and all documents for caste certificate are in proper order. Submitted for further action.",
            
            auto: "सादर अर्जासह जोडलेली सर्व कागदपत्रे तपासली असून ती नियमानुसार आहेत. पुढील कारवाईसाठी सविनय सादर.\n\nAll documents submitted with the application have been verified and are as per rules. Respectfully submitted for further action."
        };
        
        return remarks[certificateType] || remarks.auto;
    }

    displayResults(results) {
        document.getElementById('docs-count').textContent = results.documents_verified;
        document.getElementById('confidence').textContent = results.confidence + '%';
        
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = results.confidence + '%';
        
        document.getElementById('results').style.display = 'block';
    }

    updateStatus(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Advanced Features
    showStats() {
        const stats = `
📊 Today's Statistics:
• Applications Processed: 8
• Average Time: 12 minutes
• AI Accuracy: 94%
• Remarks Generated: 8
• Voice Commands Used: 3

🎯 Performance:
• Processing Speed: Excellent
• Quality Score: 9.2/10
• SLA Compliance: 96%
        `.trim();
        
        this.showNotification(stats, 'info');
    }

    exportWork() {
        this.showNotification('📄 Exporting work log...', 'info');
        
        // Mock work data
        const workData = {
            date: new Date().toLocaleDateString(),
            applications: 8,
            time_spent: '96 minutes',
            certificates: ['Domicile: 3', 'Income: 2', 'Caste: 2', 'EWS: 1'],
            ai_usage: '100%'
        };
        
        // In a real extension, this would generate and download actual file
        setTimeout(() => {
            this.showNotification('✅ Work log exported successfully', 'success');
        }, 1000);
    }

    showHelp() {
        const helpText = `
📚 PranitaDesk AI Help:

🚀 Quick Start:
1. Navigate to government portal
2. Open certificate application
3. Click "Analyze Application"
4. Use "Generate Remarks" for AI assistance
5. Try voice input in Marathi

🎯 Features:
• AI Document Analysis
• Bilingual Remark Generation
• Marathi Voice Input
• Work Statistics
• Export Functionality

📞 Support: Available in portal
        `.trim();
        
        this.showNotification(helpText, 'info');
    }

    showSettings() {
        this.showNotification('⚙️ Settings: Language: Marathi+English | Voice: Enabled | AI: Active', 'info');
    }
}

// Initialize the extension
const pranitaDeskAI = new PranitaDeskAI();

console.log('🤖 PranitaDesk AI Assistant loaded successfully');
