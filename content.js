// PranitaDesk AI Assistant - Content Script for Government Portals

class PortalIntegration {
    constructor() {
        this.portalType = 'unknown';
        this.applicationData = null;
        
        this.initializePortalIntegration();
    }

    initializePortalIntegration() {
        console.log('🏛️ Portal Integration initializing...');
        
        // Wait for page to fully load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupPortalIntegration());
        } else {
            this.setupPortalIntegration();
        }
    }

    setupPortalIntegration() {
        // Detect portal type
        this.detectPortalType();
        
        // Set up message listener
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true;
        });
        
        // Extract application data if on application page
        this.extractApplicationData();
        
        console.log('✅ Portal Integration ready for:', this.portalType);
    }

    detectPortalType() {
        const url = window.location.href;
        const title = document.title.toLowerCase();
        
        if (url.includes('revenue.mahaonline.gov.in')) {
            this.portalType = 'mahaonline_revenue';
        } else if (url.includes('mahaonline.gov.in')) {
            this.portalType = 'mahaonline';
        } else if (url.includes('aaplesarkar.mahaonline.gov.in')) {
            this.portalType = 'aaple_sarkar';
        } else if (url.includes('.gov.in')) {
            this.portalType = 'government_portal';
        }
        
        console.log('🎯 Portal detected:', this.portalType);
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'fillRemark':
                this.fillRemarkField(message.remark);
                sendResponse({ success: true });
                break;
                
            case 'extractApplicationData':
                const data = this.extractApplicationData();
                sendResponse({ success: true, data: data });
                break;
                
            case 'getDocumentList':
                const documents = this.getDocumentList();
                sendResponse({ success: true, documents: documents });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    extractApplicationData() {
        let data = {
            applicationId: this.findText(['application id', 'app id', 'application number', 'अर्ज क्रमांक']),
            applicantName: this.findText(['applicant name', 'name', 'अर्जदाराचे नाव', 'नाव']),
            certificateType: this.detectCertificateType(),
            applicationDate: this.findText(['application date', 'date', 'दिनांक']),
            status: this.findText(['status', 'स्थिती'])
        };
        
        this.applicationData = data;
        console.log('📋 Application data extracted:', data);
        
        return data;
    }

    detectCertificateType() {
        const pageText = document.body.textContent.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        const certificateKeywords = {
            'domicile': ['domicile', 'निवास', 'अधिवास'],
            'income': ['income', 'उत्पन्न', 'आय'],
            'caste': ['caste', 'जाती', 'जाति'],
            'ews': ['ews', 'economically weaker', 'आर्थिकदृष्ट्या कमकुवत'],
            'senior_citizen': ['senior citizen', 'वरिष्ठ नागरिक'],
            'age_nationality': ['age', 'nationality', 'वय', 'राष्ट्रीयत्व']
        };
        
        for (const [type, keywords] of Object.entries(certificateKeywords)) {
            for (const keyword of keywords) {
                if (pageText.includes(keyword) || url.includes(keyword)) {
                    return type + '_certificate';
                }
            }
        }
        
        return 'unknown_certificate';
    }

    findText(keywords) {
        const elements = document.querySelectorAll('*');
        
        for (const element of elements) {
            if (element.children.length === 0) { // Text node
                const text = element.textContent.toLowerCase();
                
                for (const keyword of keywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        // Try to find associated value
                        const parent = element.parentNode;
                        const siblings = Array.from(parent.children);
                        const elementIndex = siblings.indexOf(element);
                        
                        // Check next sibling
                        if (elementIndex < siblings.length - 1) {
                            const nextText = siblings[elementIndex + 1].textContent.trim();
                            if (nextText && !nextText.toLowerCase().includes(keyword.toLowerCase())) {
                                return nextText;
                            }
                        }
                        
                        // Check if current element has the value
                        const currentText = element.textContent.replace(new RegExp(keyword, 'gi'), '').trim();
                        if (currentText) {
                            return currentText;
                        }
                    }
                }
            }
        }
        
        return '';
    }

    getDocumentList() {
        const documents = [];
        
        // Common selectors for document lists
        const documentSelectors = [
            '.document-list',
            '.documents',
            '.attachments',
            '.files',
            '[class*="document"]',
            '[id*="document"]'
        ];
        
        for (const selector of documentSelectors) {
            const container = document.querySelector(selector);
            if (container) {
                const items = container.querySelectorAll('a, .document-item, .file-item, li');
                
                for (const item of items) {
                    const text = item.textContent.trim();
                    const link = item.href || item.querySelector('a')?.href;
                    
                    if (text && text.length > 3) {
                        documents.push({
                            name: text,
                            url: link || null,
                            element: item.tagName
                        });
                    }
                }
                
                if (documents.length > 0) break;
            }
        }
        
        console.log('📄 Documents found:', documents.length);
        return documents;
    }

    fillRemarkField(remarkText) {
        console.log('💬 Filling remark field with:', remarkText.substring(0, 50) + '...');
        
        // Common selectors for remark fields
        const remarkSelectors = [
            'textarea[name*="remark"]',
            'textarea[id*="remark"]',
            'textarea[placeholder*="remark"]',
            'textarea[name*="comment"]',
            'textarea[id*="comment"]',
            'textarea[placeholder*="comment"]',
            'textarea[name*="टिप्पणी"]',
            'textarea[placeholder*="टिप्पणी"]',
            'input[name*="remark"]',
            'input[id*="remark"]',
            'div[contenteditable="true"]',
            'textarea' // Fallback to any textarea
        ];
        
        let filled = false;
        
        for (const selector of remarkSelectors) {
            const elements = document.querySelectorAll(selector);
            
            for (const element of elements) {
                // Skip if element is hidden or very small
                const rect = element.getBoundingClientRect();
                if (rect.width < 50 || rect.height < 20) continue;
                
                try {
                    if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
                        element.value = remarkText;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    } else if (element.contentEditable === 'true') {
                        element.textContent = remarkText;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    
                    // Highlight the field briefly
                    element.style.border = '2px solid #4CAF50';
                    setTimeout(() => {
                        element.style.border = '';
                    }, 2000);
                    
                    filled = true;
                    console.log('✅ Remark filled in:', selector);
                    break;
                    
                } catch (error) {
                    console.error('Error filling remark:', error);
                }
            }
            
            if (filled) break;
        }
        
        if (!filled) {
            console.warn('⚠️ Could not find suitable remark field');
            
            // Show a temporary message
            this.showTemporaryMessage('⚠️ Could not automatically fill remark. Please copy manually:\n\n' + remarkText);
        }
        
        return filled;
    }

    showTemporaryMessage(message) {
        // Create a temporary overlay with the message
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 400px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            border-left: 4px solid #ff9800;
        `;
        
        overlay.textContent = message;
        document.body.appendChild(overlay);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 10000);
        
        // Make it clickable to copy
        overlay.style.cursor = 'pointer';
        overlay.addEventListener('click', () => {
            navigator.clipboard.writeText(message.split(':\n\n')[1] || message);
            overlay.textContent = '✅ Copied to clipboard!';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 2000);
        });
    }
}

// Initialize portal integration
const portalIntegration = new PortalIntegration();

console.log('🏛️ PranitaDesk Portal Integration loaded');
