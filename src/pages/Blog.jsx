import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Blog.css';
import blogPosts from '../data/blogPosts';
import Icon from '../components/Icon';
import { useSEO } from '../hooks/useSEO';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Blog() {
  useSEO({
    title: 'Plumbing Tips & Advice Blog',
    description: 'Practical plumbing advice, maintenance checklists, and emergency tips from the PlumbPro team — plus what plumber verification really means.',
    path: '/blog',
  });
  const [category, setCategory] = useState('All');
  const categories = ['All', ...Array.from(new Set(blogPosts.map(p => p.category)))];
  const posts = category === 'All' ? blogPosts : blogPosts.filter(p => p.category === category);
  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <main className="blog-page">
      <div className="blog-hero">
        <span className="eyebrow">PLUMBPRO BLOG</span>
        <h1>Plumbing tips, straight talk, no fluff.</h1>
        <p>Practical advice for keeping your home's plumbing in good shape — written for homeowners, not other plumbers.</p>
      </div>

      <div className="blog-filters">
        {categories.map(c => (
          <button key={c} className={`chip ${category === c ? 'chip-active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="blog-grid">
        {sorted.map(post => (
          <Link to={`/blog/${post.slug}`} className="blog-card" key={post.slug}>
            <span className="blog-card-category">{post.category}</span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <div className="blog-card-meta">
              <span>{formatDate(post.date)}</span>
              <span>{post.readTime}</span>
            </div>
            <span className="blog-card-read">Read article <Icon name="chevronRight" size={14} /></span>
          </Link>
        ))}
      </div>
    </main>
  );
}
export default Blog;
