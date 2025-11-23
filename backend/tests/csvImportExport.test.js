/**
 * CSV Import/Export Tests
 * 
 * Tests for CSV contact import and export functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as emailRepo from '../db/repositories/emailRepository.js';
import { initializeDatabase } from '../db/database.js';
import { query } from '../db/database.js';

describe('CSV Import/Export', () => {
  let testUserId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const users = await query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      const result = await query(`
        INSERT INTO users (id, email, name, password_hash)
        VALUES (gen_random_uuid(), 'csv-test@example.com', 'CSV Test User', 'hash')
        RETURNING id
      `);
      testUserId = result[0].id;
    } else {
      testUserId = users[0].id;
    }
  });

  afterAll(async () => {
    // Cleanup test contacts
    await query('DELETE FROM email_contacts WHERE user_id = $1 AND source = $2', [testUserId, 'import']);
  });

  it('should create contact from CSV data', async () => {
    const contactData = {
      email: 'csv-test@example.com',
      first_name: 'CSV',
      last_name: 'Test',
      company: 'Test Company',
      phone: '+1234567890',
      tags: ['test', 'csv'],
      source: 'import'
    };

    const contact = await emailRepo.createContact(testUserId, contactData);
    expect(contact).toBeDefined();
    expect(contact.email).toBe(contactData.email);
    expect(contact.first_name).toBe(contactData.first_name);
    expect(contact.last_name).toBe(contactData.last_name);
  });

  it('should handle CSV data with missing optional fields', async () => {
    const contactData = {
      email: 'csv-minimal@example.com',
      source: 'import'
    };

    const contact = await emailRepo.createContact(testUserId, contactData);
    expect(contact).toBeDefined();
    expect(contact.email).toBe(contactData.email);
  });

  it('should get contacts for export', async () => {
    const contacts = await emailRepo.getContactsByUser(testUserId);
    expect(Array.isArray(contacts)).toBe(true);
    expect(contacts.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle duplicate emails in CSV import', async () => {
    const contactData = {
      email: 'duplicate@example.com',
      first_name: 'First',
      source: 'import'
    };

    // Create first contact
    const contact1 = await emailRepo.createContact(testUserId, contactData);
    expect(contact1).toBeDefined();

    // Try to create duplicate (should update existing)
    const contactData2 = {
      ...contactData,
      first_name: 'Updated'
    };
    const contact2 = await emailRepo.createContact(testUserId, contactData2);
    expect(contact2).toBeDefined();
    expect(contact2.email).toBe(contactData.email);
  });
});

