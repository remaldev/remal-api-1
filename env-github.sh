#!/bin/bash

gh secret set ENV_TEST --body "$(base64 .env.test)"

echo "✅ Secrets 'ENV_TEST' uploaded successfully."
