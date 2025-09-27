import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for reviews (in production, use a database)
let reviews: Array<{
  id: string;
  name: string;
  role: string;
  review: string;
  rating: number;
  createdAt: string;
}> = [];

// GET - Fetch all reviews
export async function GET() {
  try {
    // Sort reviews by creation date (newest first)
    const sortedReviews = reviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return NextResponse.json({
      success: true,
      reviews: sortedReviews,
      total: reviews.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, review, rating } = body;

    // Validation
    if (!name || !role || !review || !rating) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Create new review
    const newReview = {
      id: Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      review: review.trim(),
      rating: parseInt(rating),
      createdAt: new Date().toISOString()
    };

    // Add to reviews array
    reviews.push(newReview);

    return NextResponse.json({
      success: true,
      review: newReview,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const reviewIndex = reviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    reviews.splice(reviewIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
