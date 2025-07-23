// Script to update a match with gender-specific explanations
// Run with: node src/scripts/update-match-explanation.js matchId member1Id member2Id

const fetch = require('node-fetch');

async function updateMatchExplanation(matchId, member1Id, member2Id) {
  if (!matchId || !member1Id || !member2Id) {
    console.error('Usage: node update-match-explanation.js matchId member1Id member2Id');
    process.exit(1);
  }

  console.log(`Updating explanation for match ${matchId}...`);
  
  try {
    const response = await fetch(`http://localhost:3001/api/matches/generate-explanation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId,
        member1Id,
        member2Id
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API response received successfully');
    
    // Check if we got the gender-specific explanations
    if (data.member1Explanation && data.member2Explanation) {
      console.log('\nSuccessfully received gender-specific explanations!');
      
      try {
        // Parse the explanations to verify the format
        const member1Points = JSON.parse(data.member1Explanation);
        const member2Points = JSON.parse(data.member2Explanation);
        
        console.log('\nMember 1 Explanation Points:');
        member1Points.forEach((point, index) => {
          console.log(`${index + 1}. ${point.header}: ${point.explanation}`);
        });
        
        console.log('\nMember 2 Explanation Points:');
        member2Points.forEach((point, index) => {
          console.log(`${index + 1}. ${point.header}: ${point.explanation}`);
        });
      } catch (parseError) {
        console.error('Error parsing explanation JSON:', parseError);
        console.log('Raw member1Explanation:', data.member1Explanation);
        console.log('Raw member2Explanation:', data.member2Explanation);
      }
    } else {
      console.log('Did not receive gender-specific explanations in the response');
    }
  } catch (error) {
    console.error('Error calling API:', error);
  }
}

// Get command line arguments
const matchId = process.argv[2];
const member1Id = process.argv[3];
const member2Id = process.argv[4];

updateMatchExplanation(matchId, member1Id, member2Id);
