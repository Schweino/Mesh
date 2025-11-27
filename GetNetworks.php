<?php

$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "https://sandbox-integration-api.meshconnect.com/api/v1/transfers/managed/networks",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => [
    "X-Client-Id: 1dbeed79-48ff-4e3e-99a5-08de2cf170eb",
    "X-Client-Secret: sk_sand_ati999bf.mknwphw4kvpxp9jwjz40xvq7k3sqvdrgj8ql28ion7ixxgd68scd9ohvbv8l7ht5"
  ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}