<?php

$payload = [
    "userId" => "BradTest",
    
    "restrictMultipleAccounts" => true,
    "transferOptions" => [
        "toAddresses" => [
            [
                "networkId" => "e3c7fdd8-b1fc-4e51-85ae-bb276e075611",
                "symbol" => "USDC",
                "address" => "0x0Ff0000f0A0f0000F0F000000000ffFf00f0F0f0"
            ]
        ],
        "amountInFiat" => 50,
        "isInclusiveFeeEnabled" => true,
        "generatePayLink" => false
    ],
    "disableApiKeyGeneration" => false
];

$ch = curl_init("https://sandbox-integration-api.meshconnect.com/api/v1/linktoken");

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Access-Control-Allow-Origin: *",
        "Access-Control-Allow-Methods: GET, POST, OPTIONS",
        "Access-Control-Allow-Headers: Content-Type",
        "X-Client-Id: 1dbeed79-48ff-4e3e-99a5-08de2cf170eb",
        "X-Client-Secret: sk_sand_ati999bf.mknwphw4kvpxp9jwjz40xvq7k3sqvdrgj8ql28ion7ixxgd68scd9ohvbv8l7ht5"
    ],
    CURLOPT_POSTFIELDS => json_encode($payload)
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;

?>