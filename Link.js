import { createLink } from "@meshconnect/web-link-sdk";

// Global variable to store the access token client-side
let storedAccessToken = null; 

// Helper function to store the access token locally
function sendTokenToBackend(accessToken) {
    console.log("Storing Access Token locally in JS:", accessToken);
    
    // Store token in the JS variable
    storedAccessToken = accessToken; 
    
    // Send POST to GetHoldings.php to confirm receipt (the PHP script ignores it but returns 'success')
    fetch("http://localhost/mesh/GetHoldings.php", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: accessToken }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log("Access Token confirmed received by server.");
        } else {
            console.error("Server failed to confirm token receipt:", data.message);
        }
    })
    .catch(error => {
        console.error("Error sending token to backend confirmation:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Overlay elements
    const overlay = document.getElementById("overlay");
    const closeBtn = document.getElementById("closeOverlay");
    const exitOverlay = document.getElementById("exitOverlay");
    const detailsBox = document.getElementById("details");
    const retryBtn = document.getElementById("retryPayment");
    const closeExitBtn = document.getElementById("closeExitOverlay");

    // Element References
    const getPortfolioBtn = document.getElementById("getPortfolio");
    const payButton = document.querySelector(".pay-btn");
    const productCard = document.querySelector(".card");
    const body = document.body;
    const portfolioCardDiv = document.getElementById("portfolioCard");
    const portfolioResultsDiv = document.getElementById("portfolioResults"); 
    
    // Initial setup
    overlay.style.display = "none";
    exitOverlay.style.display = "none";
    
    let linkOpened = false;
    
    // Close success overlay (when user clicks 'Close' on your receipt)
    closeBtn.addEventListener("click", () => {
        overlay.style.display = "none";
        
        if (productCard) productCard.style.display = 'block';
        if (body) body.style.display = 'flex';
    });

    // Exit overlay buttons
    retryBtn.addEventListener("click", () => {
        exitOverlay.style.display = "none";
        startPaymentFlow();
    });

    closeExitBtn.addEventListener("click", () => {
        exitOverlay.style.display = "none";
    });

    // Portfolio button click: Now POSTs the locally stored token and displays results
    if (getPortfolioBtn) {
        getPortfolioBtn.addEventListener("click", () => {
            getPortfolioBtn.style.display = "none"; 
            
            if (!storedAccessToken) {
                alert("Please connect your account first to retrieve the portfolio.");
                getPortfolioBtn.style.display = "block";
                return;
            }
            
            console.log("Attempting portfolio fetch. Token being sent:", storedAccessToken);
            
            // Set card to loading state before fetch
            portfolioResultsDiv.innerHTML = '<h3>Loading Portfolio...</h3>';
            portfolioCardDiv.style.display = 'block';

            // Send the token via POST with action: 'fetch_holdings' 
            fetch("http://localhost/mesh/GetHoldings.php", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessToken: storedAccessToken, action: 'fetch_holdings' }),
            })
            .then(res => res.json())
            .then(data => {
                getPortfolioBtn.style.display = "block"; 
                
                // --- DYNAMIC DISPLAY LOGIC ---
                let htmlContent = '<h3>💰 Your Portfolio Holdings</h3>';
                
                // Note: The Mesh API response wraps content in a "content" object
                const holdings = data.content.cryptocurrencyPositions;

                if (holdings && holdings.length > 0) {
                    htmlContent += '<ul>';
                    holdings.forEach(holding => {
                        // Use the correct keys from your successful test JSON
                        const marketValue = parseFloat(holding.marketValue || 0).toFixed(2);
                        const amount = parseFloat(holding.amount).toFixed(4);

                        htmlContent += `
                            <li>
                                <span><strong>${holding.symbol}</strong>: ${amount} units</span> 
                                <span>$${marketValue}</span>
                            </li>
                        `;
                    });
                    htmlContent += '</ul>';
                } else {
                     htmlContent += '<p>No current crypto holdings found.</p>';
                }

                portfolioResultsDiv.innerHTML = htmlContent;
                portfolioCardDiv.style.display = 'block';
                // -----------------------------

            })
            .catch(err => {
                console.error("Error fetching portfolio data:", err);
                getPortfolioBtn.style.display = "block";
                portfolioResultsDiv.innerHTML = '<p style="color:red; text-align:center;">Failed to load portfolio data. Check console for details.</p>';
                portfolioCardDiv.style.display = 'block';
            });
        });
    }
    
    // REMOVED: Transaction Details Button Listener

    // Mesh Link setup
    const meshLink = createLink({
        clientId: "1dbeed79-48ff-4e3e-99a5-08de2cf170eb",

        onIntegrationConnected: (payload) => {
            console.log("Integration Connected. Payload received:", payload);
            
            let finalAccessToken = null;
            // Extract the token from the nested structure: payload.accessToken.accountTokens[0].accessToken
            if (payload.accessToken && payload.accessToken.accountTokens && payload.accessToken.accountTokens.length > 0) {
                finalAccessToken = payload.accessToken.accountTokens[0].accessToken;
            }

            if (finalAccessToken) {
                sendTokenToBackend(finalAccessToken);
            } else {
                console.error("Access Token missing in the expected nested structure!");
            }
        },

        onExit: () => {
            if (linkOpened) {
                exitOverlay.style.display = "flex";
            }
        },

        onTransferFinished: (payload) => {
            linkOpened = false;
            exitOverlay.style.display = "none";

            if (productCard) productCard.style.display = 'block';
            if (body) body.style.display = 'flex';
            
            // Revert: Only show the portfolio button
            if (getPortfolioBtn) {
                getPortfolioBtn.style.display = 'block';
                getPortfolioBtn.style.visibility = 'visible';
            }
            
            overlay.style.display = "flex";

            const html = `
                <strong>Amount:</strong> ${payload.amount} ${payload.symbol}<br>
                <strong>Total (Fiat):</strong> $${payload.totalAmountInFiat}<br>
                <strong>Status:</strong> ${payload.status}<br><br>
                <strong>Network:</strong> ${payload.networkName}<br>
            `;
            detailsBox.innerHTML = html;
        }
    });

    // Function to fetch link token and open Mesh Link
    function startPaymentFlow() {
        if (payButton) payButton.disabled = true;

        fetch("http://localhost/mesh/GetLinkToken.php")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (payButton) payButton.disabled = false; 
                linkOpened = true; 
                meshLink.openLink(data.content.linkToken);
            })
            .catch(err => {
                console.error("Error fetching link token:", err);
                if (payButton) payButton.disabled = false; 
                alert("Failed to start payment flow. See console for details.");
            });
    }

    if (payButton) {
        payButton.addEventListener("click", startPaymentFlow);
    }
});