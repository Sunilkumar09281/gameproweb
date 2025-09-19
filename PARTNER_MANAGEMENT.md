# Partner Management System

## Overview
The Partner Management system allows you to create unique partner IDs and generate custom postback URLs for each partner. This enables you to track which partner is sending which postbacks, making it easier to manage multiple affiliate relationships.

## Features

### ✅ **Partner Creation**
- Generate unique partner IDs using UUID v4
- Store partner information (name, description, status)
- Automatic postback URL generation with partner ID parameter
- Track creation date and last activity

### ✅ **Postback Tracking**
- All postbacks are automatically tagged with partner information
- Track total postbacks per partner
- Monitor last postback received timestamp
- Enhanced postback storage with partner details

### ✅ **Partner Management UI**
- Create, edit, and delete partners
- Copy postback URLs to clipboard
- View partner statistics and activity
- Filter and search partners

## API Endpoints

### Partner Management
- `GET /api/partners` - Get all partners
- `POST /api/partners` - Create new partner
- `PUT /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner
- `GET /api/partners/:id/postbacks` - Get postbacks for specific partner

### Enhanced Postback Receiver
- `GET/POST /api/receive-postback?partner_id=<uuid>` - Receive postback with partner tracking

## How to Use

### 1. Create a Partner
1. Go to Dashboard → Partner Management
2. Click "Add Partner"
3. Enter partner name and description
4. Click "Create Partner"
5. A unique postback URL will be generated automatically

### 2. Share Postback URL
Each partner gets a unique URL like:
```
https://your-domain.com/api/receive-postback?partner_id=550e8400-e29b-41d4-a716-446655440000
```

### 3. Track Postbacks
- All postbacks sent to the partner-specific URL are automatically tracked
- View postback history in the Postback Receiver section
- Filter postbacks by partner ID or partner name
- Monitor partner activity and performance

## Partner Data Structure

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Affiliate Partner XYZ",
  "description": "Premium gaming affiliate partner",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "totalPostbacks": 156,
  "lastPostbackAt": "2024-01-20T14:25:30.000Z",
  "postbackUrl": "https://your-domain.com/api/receive-postback?partner_id=550e8400-e29b-41d4-a716-446655440000",
  "status": "active"
}
```

## Enhanced Postback Data

Each postback now includes partner information:

```javascript
{
  "id": "postback-uuid",
  "method": "GET",
  "receivedAt": "2024-01-20T14:25:30.000Z",
  "partnerId": "550e8400-e29b-41d4-a716-446655440000",
  "partnerName": "Affiliate Partner XYZ",
  "query": { /* query parameters */ },
  "headers": { /* request headers */ },
  "body": { /* request body */ },
  "ip": "192.168.1.1"
}
```

## Benefits

### 🎯 **Better Tracking**
- Know exactly which partner sent each postback
- Track partner performance and activity
- Identify high-performing partners

### 📊 **Analytics**
- Partner-specific postback statistics
- Activity monitoring and reporting
- Performance comparison between partners

### 🔒 **Security**
- Unique URLs prevent postback spoofing
- Partner-specific access control
- Audit trail for all postback activity

### 🚀 **Scalability**
- Support unlimited number of partners
- Efficient partner lookup and tracking
- Clean separation of partner data

## Usage Examples

### Creating a Partner via API
```bash
curl -X POST https://your-domain.com/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Network ABC",
    "description": "Mobile gaming affiliate network"
  }'
```

### Getting Partner Postbacks
```bash
curl "https://your-domain.com/api/partners/550e8400-e29b-41d4-a716-446655440000/postbacks?limit=50"
```

### Example Partner Postback URL
```
https://your-domain.com/api/receive-postback?partner_id=550e8400-e29b-41d4-a716-446655440000&offer_id=123&payout=2.50&status=approved
```

## File Storage
- Partners: `postback_backend/partners.json`
- Enhanced postbacks: `postback_backend/postbacks.json` (now includes partner info)

## Security Considerations
- Partner IDs are UUIDs, making them difficult to guess
- Each partner gets a unique URL, preventing cross-contamination
- All postback data includes partner verification
- Partner management requires dashboard access

## Migration Notes
- Existing postbacks without partner_id will show as "Unknown Partner"
- The system is backward compatible with existing postback URLs
- No changes required to existing integrations unless you want partner tracking

## Next Steps
1. Test the partner management system
2. Create your first partner
3. Share the generated postback URL with your affiliate
4. Monitor incoming postbacks in the dashboard
5. Analyze partner performance using the tracking data
