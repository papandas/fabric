# Multi-Party Finance Network
Hyperledger Fabric Blockchain Project

 Defines the members of the network, the transactions, and who should approve transactions.

- Buyer
  - Create an order
  - Submit an order
  - Receive a Shipment
  - Dispute an Order
  - Approve payment on an order

- Finance Company
  - Receive Request for Payment
  - Approve and Pay
  - Receive notifications of dispute
  - Resolve Dispute

- Seller
  - Accept an order
  - Submit an order to a provider/supplier
  - Receive Notification of Delivery
  - Request Payment
  - Resove a Dispute
  - Refund an Order

- Shipper
  - Receiver Request for Delivery
  - Post notification of delivery

- Provider
  - Receive an item request
  - Issue, resolve backorder
  - Request Delivery
  - Receive Notification of Delivery

- Using Mocha Service to test the network

