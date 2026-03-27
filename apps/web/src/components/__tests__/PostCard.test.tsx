import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PostCard } from '../PostCard';
import { Post } from '../../data/mock';

const mockPost: Post = {
  id: 'test-1',
  author: {
    id: 'u1',
    name: 'Test User',
    major: 'Computer Science',
    graduationYear: 2025,
  },
  content: 'This is a test post content',
  timestamp: 'Just now',
  upvotes: 10,
  downvotes: 2,
  comments: 5,
};

describe('PostCard Component', () => {
  it('renders correctly with given post data', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/)).toBeInTheDocument();
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    // 10 upvotes - 2 downvotes = 8
    expect(screen.getByText('+8')).toBeInTheDocument();
    expect(screen.getByText(/5 Replies/)).toBeInTheDocument();
  });

  it('handles upvoting correctly', () => {
    render(<PostCard post={mockPost} />);

    const upvoteButton = screen.getByLabelText('Upvote');
    fireEvent.click(upvoteButton);

    // (10 + 1) - 2 = 9
    expect(screen.getByText('+9')).toBeInTheDocument();

    // Remove upvote
    fireEvent.click(upvoteButton);
    expect(screen.getByText('+8')).toBeInTheDocument();
  });

  it('handles downvoting correctly', () => {
    render(<PostCard post={mockPost} />);

    const downvoteButton = screen.getByLabelText('Downvote');
    fireEvent.click(downvoteButton);

    // 10 - (2 + 1) = 7
    expect(screen.getByText('+7')).toBeInTheDocument();

    // Remove downvote
    fireEvent.click(downvoteButton);
    expect(screen.getByText('+8')).toBeInTheDocument();
  });

  it('handles switching from upvote to downvote', () => {
    render(<PostCard post={mockPost} />);

    const upvoteButton = screen.getByLabelText('Upvote');
    const downvoteButton = screen.getByLabelText('Downvote');

    fireEvent.click(upvoteButton);
    expect(screen.getByText('+9')).toBeInTheDocument(); // 11 upvotes - 2 downvotes

    fireEvent.click(downvoteButton);
    expect(screen.getByText('+7')).toBeInTheDocument(); // 10 upvotes - 3 downvotes
  });
});
