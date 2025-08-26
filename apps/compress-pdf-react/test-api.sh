#!/bin/bash

# Test script for compress-pdf API endpoints
API_BASE="https://api.compresspdf.co.za"

echo "🧪 Testing Compress PDF API Endpoints"
echo "====================================="
echo "API Base: $API_BASE"
echo ""

# Test 1: Stats endpoint
echo "📊 Testing Stats Endpoint..."
echo "GET $API_BASE/v1/compress-pdf/stats"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$API_BASE/v1/compress-pdf/stats")
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*//')
echo "Status: $http_status"
echo "Response: $response_body"
echo ""

# Test 2: Reviews endpoint
echo "⭐ Testing Reviews Endpoint..."
echo "GET $API_BASE/v1/compress-pdf/reviews"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$API_BASE/v1/compress-pdf/reviews")
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*//')
echo "Status: $http_status"
echo "Response: $response_body"
echo ""

# Test 3: ZIP endpoint (should fail without valid data, but should return proper error)
echo "📦 Testing ZIP Endpoint..."
echo "POST $API_BASE/v1/jobs/zip"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$API_BASE/v1/jobs/zip" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"job_id":"test","token":"test"}]}')
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*//')
echo "Status: $http_status"
echo "Response: $response_body"
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "Expected Results:"
echo "- Stats: Should return JSON with total_compressed count"
echo "- Reviews: Should return JSON with reviewCount and ratingValue"
echo "- ZIP: Should return error (which is expected without valid job data)"
echo ""
echo "If any endpoint returns 404 or connection errors, the API is not accessible."
