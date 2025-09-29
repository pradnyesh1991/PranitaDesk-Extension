// PranitaDesk AI Assistant - Background Service Worker

class BackgroundService {
    constructor() {
        this.setupEventListeners();
        this.initializeBackground();
    }

    initializeBackground() {
        console.log('🔧 PranitaDesk Background Service Worker initialized');
        
        // Set up installation handler
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                console.log('🎉 PranitaDesk AI Assistant installed successfully');
                this.showWelcomeNotification();
            } else if (details.reason === 'update') {
                console.log('⬆️ PranitaDesk AI Assistant updated');
            }
        });
    }

    setupEventListeners() {
        // Listen for messages from popup and content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Tab updates for portal detection
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.checkForGovernmentPortal(tab);
            }
        });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'analyzeApplication':
                    const analysisResult = await this.analyzeApplication(message.data);
                    sendResponse({ success: true, data: analysisResult });
                    break;

                case 'generateRemark':
                    const remarkResult = await this.generateRemark(message.data);
                    sendResponse({ success: true, data: remarkResult });
                    break;

                case 'getPortalStatus':
                    const portalStatus = await this.getPortalStatus();
                    sendResponse({ success: true, data: portalStatus });
                    break;

                case 'logWorkActivity':
                    await this.logWorkActivity(message.data);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action: ' + message.action });
            }
        } catch (error) {
            console.error('Background message handling error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async analyzeApplication(data) {
        console.log('🔍 Analyzing application in background...');
        
        try {
            // Simulate API call to analyze application
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock analysis results
            const analysis = {
                overall_completeness: Math.floor(Math.random() * 30) + 70, // 70-100%
                submitted_documents: [
                    'Aadhaar Card', 
                    'Ration Card', 
                    'Income Certificate',
                    'Application Form'
                ],
                missing_documents: Math.random() > 0.7 ? ['Address Proof'] : [],
                confidence_score: Math.floor(Math.random() * 20) + 80, // 80-100%
                processing_time: Date.now(),
                ocr_method: 'AI OCR',
                ai_assistance: true
            };

            console.log('✅ Application analysis completed');
            return { analysis };

        } catch (error) {
            console.error('❌ Application analysis failed:', error);
            throw new Error('Analysis failed: ' + error.message);
        }
    }

    async generateRemark(data) {
        console.log('💬 Generating remark in background...');
        
        try {
            const { certificateType, language = 'bilingual' } = data;
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Generate bilingual remarks based on certificate type
            const remarks = this.getBilingualRemarks(certificateType);
            
            console.log('✅ Bilingual remark generated');
            return { 
                generated_remark: remarks,
                certificate_type: certificateType,
                language: language,
                ai_enhanced: true
            };

        } catch (error) {
            console.error('❌ Remark generation failed:', error);
            throw new Error('Remark generation failed: ' + error.message);
        }
    }

    getBilingualRemarks(certificateType) {
        const remarkTemplates = {
            domicile_certificate: {
                marathi: "सादर कागदपत्रांची तपासणी केली असून निवास प्रमाणपत्रासाठी सर्व आवश्यक कागदपत्रे योग्य आहेत. पुढील कारवाईसाठी सविनय सादर.",
                english: "Upon verification of submitted documents, all required papers for domicile certificate are found to be in order. Respectfully submitted for further action."
            },
            income_certificate: {
                marathi: "सादर अर्जासह जोडलेली कागदपत्रे तपासली असून उत्पन्न प्रमाणपत्रासाठी सर्व आवश्यक कागदपत्रे पूर्ण आहेत. पुढील कारवाईसाठी सविनय सादर.",
                english: "The documents submitted with the application have been verified and all required documents for income certificate are complete. Respectfully submitted for further action."
            },
            caste_certificate: {
                marathi: "सादर अर्जासह सादर केलेली कागदपत्रे तपासून पाहिली असून जाती प्रमाणपत्रासाठी सर्व कागदपत्रे योग्य स्वरूपात आहेत. पुढील कारवाईसाठी सादर.",
                english: "The documents submitted with the application have been examined and all documents for caste certificate are in proper order. Submitted for further action."
            },
            ews_certificate: {
                marathi: "सादर अर्जासह जोडलेली कागदपत्रे तपासली असून EWS प्रमाणपत्रासाठी सर्व आवश्यक कागदपत्रे नियमानुसार आहेत. पुढील कारवाईसाठी सादर.",
                english: "The documents submitted with the application have been verified and all required documents for EWS certificate are as per norms. Submitted for further action."
            },
            auto: {
                marathi: "सादर अर्जासह जोडलेली सर्व कागदपत्रे तपासली असून ती नियमानुसार आहेत. पुढील कारवाईसाठी सविनय सादर.",
                english: "All documents submitted with the application have been verified and are as per rules. Respectfully submitted for further action."
            }
        };

        const template = remarkTemplates[certificateType] || remarkTemplates.auto;
        return `${template.marathi}\n\n${template.english}`;
    }

    async getPortalStatus() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!activeTab || !activeTab.url) {
                return { portal: 'unknown', status: 'not_detected' };
            }

            const url = activeTab.url;
            
            if (url.includes('revenue.mahaonline.gov.in')) {
                return { portal: 'mahaonline_revenue', status: 'connected' };
            } else if (url.includes('mahaonline.gov.in')) {
                return { portal: 'mahaonline', status: 'connected' };
            } else if (url.includes('aaplesarkar.mahaonline.gov.in')) {
                return { portal: 'aaple_sarkar', status: 'connected' };
            } else if (url.includes('.gov.in')) {
                return { portal: 'government_portal', status: 'connected' };
            } else {
                return { portal: 'non_government', status: 'not_government_portal' };
            }

        } catch (error) {
            console.error('Portal status check failed:', error);
            return { portal: 'error', status: 'check_failed' };
        }
    }

    async checkForGovernmentPortal(tab) {
        if (!tab.url) return;
        
        const isGovernmentPortal = tab.url.includes('.gov.in');
        
        if (isGovernmentPortal) {
            console.log('🏛️ Government portal detected:', tab.url);
            
            // Update extension icon or show notification if needed
            try {
                await chrome.action.setBadgeText({
                    text: '✓',
                    tabId: tab.id
                });
                await chrome.action.setBadgeBackgroundColor({
                    color: '#4CAF50',
                    tabId: tab.id
                });
            } catch (error) {
                console.error('Failed to update badge:', error);
            }
        } else {
            // Clear badge for non-government portals
            try {
                await chrome.action.setBadgeText({
                    text: '',
                    tabId: tab.id
                });
            } catch (error) {
                console.error('Failed to clear badge:', error);
            }
        }
    }

    async logWorkActivity(data) {
        try {
            // Store work activity in local storage
            const today = new Date().toISOString().split('T')[0];
            
            let workLog = await this.getStoredData('workLog') || {};
            if (!workLog[today]) {
                workLog[today] = [];
            }
            
            workLog[today].push({
                timestamp: new Date().toISOString(),
                ...data
            });

            await this.setStoredData('workLog', workLog);
            console.log('📋 Work activity logged successfully');

        } catch (error) {
            console.error('Failed to log work activity:', error);
            throw error;
        }
    }

    async getStoredData(key) {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key];
        } catch (error) {
            console.error('Failed to get stored data:', error);
            return null;
        }
    }

    async setStoredData(key, data) {
        try {
            await chrome.storage.local.set({ [key]: data });
        } catch (error) {
            console.error('Failed to set stored data:', error);
            throw error;
        }
    }

    showWelcomeNotification() {
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: '🤖 PranitaDesk AI Assistant',
                message: 'Successfully installed! Ready for government certificate processing.',
                priority: 1
            });
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();

console.log('🔧 PranitaDesk AI Background Service Worker loaded');
