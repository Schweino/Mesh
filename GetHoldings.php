<?php
// Start the session to store the access token securely between requests
session_start();

// =========================================================================
// 🎯 CRITICAL FIX: CORS HEADERS 🎯
// These headers allow your frontend (running on port 5176) to communicate 
// with this backend script (running on port 80 or similar).
// =========================================================================
header("Access-Control-Allow-Origin: http://localhost:5176");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // Allow necessary methods
header("Access-Control-Allow-Headers: Content-Type"); // Allow Content-Type header for JSON POSTs
header("Access-Control-Allow-Credentials: true"); // Crucial for session/cookies (like PHP's session_start)

// Handle preflight OPTIONS request (sent by browser before POST/GET)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Configuration ---
$clientId = "1dbeed79-48ff-4e3e-99a5-08de2cf170eb";
$clientSecret = "sk_sand_ati999bf.mknwphw4kvpxp9jwjz40xvq7k3sqvdrgj8ql28ion7ixxgd68scd9ohvbv8l7ht5";
$apiEndpoint = "https://sandbox-integration-api.meshconnect.com/api/v1/holdings/get";

// Set default headers to JSON for responses
header('Content-Type: application/json');

// =========================================================================
// 1. POST Request: Receive and Store the Access Token from Link.js
// =========================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read the JSON data sent from Link.js
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $accessToken = $data['accessToken'] ?? null;

    if ($accessToken) {
        // Store the received Access Token in the user's session
        $_SESSION['mesh_access_token'] = $accessToken; 
        
        // Respond to JS that storage was successful
        echo json_encode(['status' => 'success', 'message' => 'Access Token stored.']);
        exit;
    }

    // Handle missing token error
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Access Token not provided in POST body.']);
    exit;
}

// =========================================================================
// 2. GET Request: Retrieve Holdings when the "Get Portfolio" button is clicked
// =========================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // Retrieve the stored Access Token from the session
    $accessToken = $_SESSION['mesh_access_token'] ?? null; 

    if (!$accessToken) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'No Access Token found. Please connect your account first.']);
        exit;
    }
    
    // --- Mesh API Call Setup ---
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $apiEndpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "POST",
        
        CURLOPT_POSTFIELDS => json_encode([
            'authToken' => $accessToken, 
            'type' => 'Coinbase',
            'includeMarketValue' => true
        ]),
        
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "X-Client-Id: " . $clientId,
            "X-Client-Secret: " . $clientSecret
        ],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);

    curl_close($curl);

    if ($err) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => "cURL Error: " . $err]);
    } else {
        echo $response;
    }
    
    exit;
}

// Handle unexpected request methods
http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed. Only POST (for token) and GET (for holdings) are supported.']);

?>