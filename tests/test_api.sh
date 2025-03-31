#!/bin/bash

# API Test Script for User Authentication System
# Save this as test_api.sh and run with: bash test_api.sh

# Base URL for the API with correct prefixes
BASE_URL="http://localhost:3000"
AUTH_URL="$BASE_URL/api/auth"
USERS_URL="$BASE_URL/api/users"
TOKEN=""
USER_ID=""

# Text formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing User Authentication API ===${NC}"
echo -e "${BLUE}Running tests against $BASE_URL${NC}"
echo -e "${BLUE}Auth routes: $AUTH_URL${NC}"
echo -e "${BLUE}User routes: $USERS_URL${NC}\n"

# Function to check if the API is running
check_api() {
  echo -e "\n${BLUE}Checking if API is running...${NC}"
  response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
  
  if [ $response -eq 200 ] || [ $response -eq 404 ]; then
    echo -e "${GREEN}✓ API is running${NC}"
    return 0
  else
    echo -e "${RED}✗ API is not running on port 3000${NC}"
    return 1
  fi
}

# 1. Register a new user
test_register() {
  echo -e "\n${BLUE}Testing user registration...${NC}"
  
  # Create a unique username based on timestamp
  timestamp=$(date +%s)
  username="testuser_$timestamp"
  
  response=$(curl -s -X POST "$AUTH_URL/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\",\"email\":\"$username@example.com\",\"password\":\"password123\"}")
  
  # Check if the response contains a token
  if echo $response | grep -q "token"; then
    echo -e "${GREEN}✓ User registration successful${NC}"
    echo "Response: $response"
    # Extract user ID if available
    USER_ID=$(echo $response | grep -o '"user":{[^}]*}' | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$USER_ID" ]; then
      echo -e "${GREEN}✓ Extracted user ID: $USER_ID${NC}"
    fi
    # Extract token
    TOKEN=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Extracted token for future requests${NC}"
    return 0
  else
    echo -e "${RED}✗ User registration failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# 2. Test login
test_login() {
  echo -e "\n${BLUE}Testing user login...${NC}"
  
  # Use the same username from registration
  timestamp=$(date +%s)
  username="testuser_$timestamp"
  
  # First register a user
  register_response=$(curl -s -X POST "$AUTH_URL/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\",\"email\":\"$username@example.com\",\"password\":\"password123\"}")
  
  # Then try to login
  login_response=$(curl -s -X POST "$AUTH_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$username@example.com\",\"password\":\"password123\"}")
  
  # Check if the response contains a token
  if echo $login_response | grep -q "token"; then
    echo -e "${GREEN}✓ User login successful${NC}"
    echo "Response: $login_response"
    # Extract token for subsequent tests
    TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    # Extract user ID
    USER_ID=$(echo $login_response | grep -o '"user":{[^}]*}' | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$USER_ID" ]; then
      echo -e "${GREEN}✓ Extracted user ID: $USER_ID${NC}"
    fi
    return 0
  else
    echo -e "${RED}✗ User login failed${NC}"
    echo "Response: $login_response"
    return 1
  fi
}

# 3. Test token verification
test_verify_token() {
  echo -e "\n${BLUE}Testing token verification...${NC}"
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ No token available. Run login test first.${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "$AUTH_URL/verify" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo $response | grep -q "valid"; then
    echo -e "${GREEN}✓ Token verification successful${NC}"
    echo "Response: $response"
    return 0
  else
    echo -e "${RED}✗ Token verification failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# 4. Test get all users (requires authentication)
test_get_all_users() {
  echo -e "\n${BLUE}Testing get all users...${NC}"
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ No token available. Run login test first.${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "$USERS_URL/" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo $response | grep -q "username"; then
    echo -e "${GREEN}✓ Get all users successful${NC}"
    echo "Response: $response"
    return 0
  else
    echo -e "${RED}✗ Get all users failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# 5. Test get user by ID (requires authentication)
test_get_user_by_id() {
  echo -e "\n${BLUE}Testing get user by ID...${NC}"
  
  if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
    echo -e "${RED}✗ No token or user ID available. Run login test first.${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "$USERS_URL/$USER_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo $response | grep -q "username"; then
    echo -e "${GREEN}✓ Get user by ID successful${NC}"
    echo "Response: $response"
    return 0
  else
    echo -e "${RED}✗ Get user by ID failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# 6. Test update user (requires authentication)
test_update_user() {
  echo -e "\n${BLUE}Testing update user...${NC}"
  
  if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
    echo -e "${RED}✗ No token or user ID available. Run login test first.${NC}"
    return 1
  fi
  
  response=$(curl -s -X PUT "$USERS_URL/$USER_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"username\":\"updated_username\"}")
  
  if echo $response | grep -q "updated_username"; then
    echo -e "${GREEN}✓ Update user successful${NC}"
    echo "Response: $response"
    return 0
  else
    echo -e "${RED}✗ Update user failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# 7. Test delete user (requires authentication)
test_delete_user() {
  echo -e "\n${BLUE}Testing delete user...${NC}"
  
  if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
    echo -e "${RED}✗ No token or user ID available. Run login test first.${NC}"
    return 1
  fi
  
  response=$(curl -s -X DELETE "$USERS_URL/$USER_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo $response | grep -q "deleted"; then
    echo -e "${GREEN}✓ Delete user successful${NC}"
    echo "Response: $response"
    return 0
  else
    echo -e "${RED}✗ Delete user failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# Run all tests
run_all_tests() {
  check_api
  if [ $? -ne 0 ]; then
    echo -e "${RED}API is not running. Aborting tests.${NC}"
    exit 1
  fi
  
  test_register
  test_login
  test_verify_token
  test_get_all_users
  test_get_user_by_id
  test_update_user
  test_delete_user
  
  echo -e "\n${BLUE}=== Test Summary ===${NC}"
  echo -e "${GREEN}API tests completed.${NC}"
}

# Run the tests
run_all_tests