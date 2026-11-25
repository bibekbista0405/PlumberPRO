import React, { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import '../styles/Blog.css';
import blogPosts from '../data/blogPosts';
import Icon from '../components/Icon';
import { useSEO } from '../hooks/useSEO';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const FAQ_SCRIPT_ID = 'plumbpro-faq-data';

function useFAQStructuredData(post) {
  useEffect(() => {
    if (!post?.faq) return undefined;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.body.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
    let el = document.getElementById(FAQ_SCRIPT_ID);
    if (!el) {
      el = document.createElement('script');
      el.id = FAQ_SCRIPT_ID;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => { el?.remove(); };
  }, [post]);
}

function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find(p => p.slug === slug);
  const related = post ? blogPosts.filter(p => p.slug !== slug && p.category === post.category).slice(0, 2) : [];

  useSEO({
    title: post?.title,
    description: post?.excerpt,
    path: `/blog/${slug}`,
  });
  useFAQStructuredData(post);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <main className="blog-post-page">
      <article className="blog-post">
        <Link to="/blog" className="blog-back"><Icon name="chevronRight" size={13} className="flip" /> Back to blog</Link>
        <span className="blog-card-category">{post.category}</span>
        <h1>{post.title}</h1>
        <div className="blog-post-meta">
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readTime}</span>
          <span>·</span>
          <span>PlumbPro Team</span>
        </div>
        <div className="blog-post-body">
          {post.faq
            ? post.body.map((block, i) => (
                <div className="faq-item" key={i}>
                  <h2>{block.q}</h2>
                  <p>{block.a}</p>
                </div>
              ))
            : post.body.map((block, i) => block.h ? <h2 key={i}>{block.h}</h2> : <p key={i}>{block.p}</p>)}
        </div>
        <div className="blog-post-cta">
          <div>
            <strong>Need this fixed, not just explained?</strong>
            <span>Book a verified plumber near you in a couple of minutes.</span>
          </div>
          <Link to="/book-plumber" className="btn-primary">Book a plumber</Link>
        </div>
      </article>

      {related.length > 0 && (
        <div className="blog-related">
          <h3>More on {post.category}</h3>
          <div className="blog-grid">
            {related.map(p => (
              <Link to={`/blog/${p.slug}`} className="blog-card" key={p.slug}>
                <span className="blog-card-category">{p.category}</span>
                <h2>{p.title}</h2>
                <p>{p.excerpt}</p>
                <span className="blog-card-read">Read article <Icon name="chevronRight" size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
export default BlogPost;
