import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST() {
  try {
    const now = Timestamp.now();
    const oneWeekFromNow = Timestamp.fromDate(
      new Date(now.toDate().getTime() + 7 * 24 * 60 * 60 * 1000)
    );
    
    const testTip = {
      title: "Perfect Your Profile",
      content: "Adding high-quality photos and completing all sections of your profile significantly increases your chances of making meaningful connections. Take time to showcase your personality and interests.",
      shortDescription: "Profiles with detailed information and clear photos receive 40% more matches!",
      category: "profile_improvement",
      status: "active", // Set to active so it shows up immediately
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      expiresAt: oneWeekFromNow,
      aiGenerated: false,
      quickTips: [
        "Use recent photos that clearly show your face",
        "Include at least one full-body photo",
        "Add photos of you doing activities you enjoy",
        "Be specific about your interests rather than generic statements",
        "Have a friend review your profile for feedback"
      ],
      didYouKnow: "Users who complete all profile sections are 70% more likely to receive messages and match requests compared to those with minimal information.",
      weeklyChallenge: "Review your profile and add at least three new details about yourself that you haven't shared before. This gives potential matches more conversation starters!",
      viewCount: 0,
      uniqueViewCount: 0
    };

    const docRef = await db.collection('weeklyTips').add(testTip);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test tip created successfully', 
      tipId: docRef.id 
    });
  } catch (error) {
    console.error('Error creating test tip:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
