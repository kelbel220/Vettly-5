'use client';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

// Collection name for email queue
const EMAIL_QUEUE_COLLECTION = 'emailQueue';

/**
 * Interface for email data
 */
interface EmailData {
  to: string;
  from: string;
  subject: string;
  body: string;
  html?: string;
  createdAt: any; // Firebase Timestamp
  status: 'pending' | 'sent' | 'failed';
  matchId?: string;
  memberId?: string;
  type: 'calendar_invite' | 'payment_confirmation' | 'other';
}

/**
 * Send an email with a calendar booking link to a member
 * @param email The email address of the recipient
 * @param memberName The name of the member
 * @param matchId The ID of the match
 * @param memberId The ID of the member
 * @returns Promise that resolves when the email is queued
 */
export async function sendCalendarBookingEmail(
  email: string,
  memberName: string,
  matchId: string,
  memberId: string
): Promise<void> {
  try {
    // Google Calendar booking link - in a real app, this would be dynamically generated
    const calendarLink = 'https://calendly.com/kschulter88/vettly-matchmaker-meeting';
    
    const emailData: EmailData = {
      to: email,
      from: 'kschulter88@gmail.com',
      subject: 'Schedule Your Vettly Matchmaker Meeting',
      body: `
        Dear ${memberName},
        
        Congratulations on your match! To proceed with arranging your date, please schedule a 15-minute virtual meeting with your matchmaker.
        
        Click the link below to book your meeting:
        ${calendarLink}
        
        This meeting is a one-time requirement for your first match on Vettly.
        
        Best regards,
        The Vettly Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B00CC;">Schedule Your Vettly Matchmaker Meeting</h2>
          <p>Dear ${memberName},</p>
          <p>Congratulations on your match! To proceed with arranging your date, please schedule a 15-minute virtual meeting with your matchmaker.</p>
          <p><a href="${calendarLink}" style="display: inline-block; background-color: #3B00CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Book Your Meeting</a></p>
          <p>This meeting is a one-time requirement for your first match on Vettly.</p>
          <p>Best regards,<br>The Vettly Team</p>
        </div>
      `,
      createdAt: serverTimestamp(),
      status: 'pending',
      matchId,
      memberId,
      type: 'calendar_invite'
    };

    // Add email to the queue collection
    await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), emailData);
    
    console.log(`Calendar booking email queued for ${email}`);
  } catch (error) {
    console.error('Error sending calendar booking email:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
}

/**
 * Send a payment confirmation email to a member
 * @param email The email address of the recipient
 * @param memberName The name of the member
 * @param matchId The ID of the match
 * @param memberId The ID of the member
 * @returns Promise that resolves when the email is queued
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  memberName: string,
  matchId: string,
  memberId: string
): Promise<void> {
  try {
    const emailData: EmailData = {
      to: email,
      from: 'kschulter88@gmail.com',
      subject: 'Vettly Membership Payment Confirmation',
      body: `
        Dear ${memberName},
        
        Thank you for completing your Vettly membership payment. Your payment has been processed successfully.
        
        You'll receive a separate email with a link to schedule your virtual meeting with your matchmaker.
        
        Best regards,
        The Vettly Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B00CC;">Vettly Membership Payment Confirmation</h2>
          <p>Dear ${memberName},</p>
          <p>Thank you for completing your Vettly membership payment. Your payment has been processed successfully.</p>
          <p>You'll receive a separate email with a link to schedule your virtual meeting with your matchmaker.</p>
          <p>Best regards,<br>The Vettly Team</p>
        </div>
      `,
      createdAt: serverTimestamp(),
      status: 'pending',
      matchId,
      memberId,
      type: 'payment_confirmation'
    };

    // Add email to the queue collection
    await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), emailData);
    
    console.log(`Payment confirmation email queued for ${email}`);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
}
