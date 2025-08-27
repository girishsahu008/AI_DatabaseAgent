# SSH Authentication Setup Guide

This guide explains how to configure SSH authentication for your MCP PostgreSQL server.

## Option 1: Password-based Authentication (Recommended for quick setup)

### 1. Update your `config.env` file:

```bash
# SSH Authentication Method
SSH_AUTH_METHOD=password
SSH_PASSWORD=your_actual_ssh_password

# Comment out or remove key-based options
# SSH_AUTH_METHOD=key
# SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
# SSH_PASSPHRASE=your_ssh_passphrase
```

### 2. Required environment variables:
- `SSH_HOST`: Your SSH server hostname or IP address
- `SSH_PORT`: SSH port (usually 22)
- `SSH_USERNAME`: Your SSH username
- `SSH_PASSWORD`: Your SSH password

### 3. Advantages:
- Quick to set up
- No need to manage SSH keys
- Works with any SSH server

### 4. Disadvantages:
- Less secure than key-based authentication
- Password might be stored in plain text (consider using environment variables)

## Option 2: Key-based Authentication (Recommended for production)

### 1. Generate SSH key pair (if you don't have one):

```bash
# Generate a new SSH key pair
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Or use Ed25519 (more modern and secure)
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. Copy public key to your SSH server:

```bash
# Copy the public key to your server
ssh-copy-id username@your_server_ip

# Or manually copy the content of ~/.ssh/id_rsa.pub to ~/.ssh/authorized_keys on your server
```

### 3. Update your `config.env` file:

```bash
# SSH Authentication Method
SSH_AUTH_METHOD=key
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# If your private key has a passphrase, uncomment this:
# SSH_PASSPHRASE=your_private_key_passphrase

# Comment out password-based options
# SSH_AUTH_METHOD=password
# SSH_PASSWORD=your_ssh_password
```

### 4. Required environment variables:
- `SSH_HOST`: Your SSH server hostname or IP address
- `SSH_PORT`: SSH port (usually 22)
- `SSH_USERNAME`: Your SSH username
- `SSH_PRIVATE_KEY_PATH`: Path to your private key file
- `SSH_PASSPHRASE`: (Optional) Passphrase for your private key

### 5. Advantages:
- More secure than password authentication
- No passwords stored in configuration files
- Can use key-based authentication policies on the server

### 6. Disadvantages:
- Requires SSH key management
- Initial setup is more complex

## Testing Your Configuration

### 1. Test SSH connection manually:

```bash
# For password-based authentication
ssh username@your_server_ip

# For key-based authentication
ssh -i ~/.ssh/id_rsa username@your_server_ip
```

### 2. Test the MCP server connection:

```bash
npm run test:connection
```

## Security Best Practices

### 1. Environment Variables:
- Store sensitive information in environment variables instead of config files
- Use `.env` files that are not committed to version control
- Consider using a secrets management service for production

### 2. SSH Key Management:
- Use strong passphrases for your private keys
- Regularly rotate SSH keys
- Use different keys for different services
- Consider using SSH agents for key management

### 3. Server Security:
- Disable password authentication on your SSH server if using key-based auth
- Use non-standard SSH ports
- Implement fail2ban or similar intrusion prevention
- Regularly update your SSH server

## Troubleshooting

### Common Issues:

1. **Permission denied (publickey,password)**
   - Check if your SSH key is properly copied to the server
   - Verify the private key path in your config
   - Ensure the private key has correct permissions (600)

2. **Connection timeout**
   - Verify SSH_HOST and SSH_PORT are correct
   - Check if the SSH server is running and accessible
   - Verify firewall settings

3. **Authentication failed**
   - Double-check username and password/key
   - Ensure SSH_AUTH_METHOD is set correctly
   - Verify the private key file exists and is readable

### Debug Mode:
Enable debug logging by setting the environment variable:
```bash
DEBUG=ssh2*
npm run test:connection
```

## Example Configuration Files

### Password-based authentication (`config.env`):
```bash
SSH_HOST=192.168.1.100
SSH_PORT=22
SSH_USERNAME=dbuser
SSH_AUTH_METHOD=password
SSH_PASSWORD=mySecurePassword123
```

### Key-based authentication (`config.env`):
```bash
SSH_HOST=192.168.1.100
SSH_PORT=22
SSH_USERNAME=dbuser
SSH_AUTH_METHOD=key
SSH_PRIVATE_KEY_PATH=C:\Users\YourUsername\.ssh\id_rsa
SSH_PASSPHRASE=myKeyPassphrase
```

Remember to replace the example values with your actual server details!
