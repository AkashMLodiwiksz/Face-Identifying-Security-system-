# Contributing to Face Recognition Security System

Thank you for considering contributing to this project! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and encourage participation
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## How Can I Contribute?

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating an issue
3. **Include details:**
   - Operating system
   - Node.js and Python versions
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Enhancements

1. **Check existing feature requests**
2. **Describe the feature** clearly
3. **Explain why it would be useful**
4. **Provide examples** if possible

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
6. **Push to your fork**
7. **Open a Pull Request**

## Development Setup

### Prerequisites

- Node.js v18+
- Python 3.9+
- PostgreSQL 18+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Face-Identifying-Security-system-.git
cd Face-Identifying-Security-system-

# Install dependencies
npm run install-all

# Configure environment
cd backend
cp .env.example .env
# Edit .env with your settings

# Create database
createdb face_recognition_db

# Run development servers
cd ..
npm run dev
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console errors
- [ ] Code is commented where necessary
- [ ] README updated if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests passing
```

## Coding Standards

### JavaScript/React

```javascript
// Use functional components
const MyComponent = () => {
  // Component logic
  return <div>Content</div>;
};

// Use descriptive names
const handleSubmit = () => { };
const isLoading = true;

// Use PropTypes or TypeScript
MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
};
```

### Python/Flask

```python
# Follow PEP 8
# Use snake_case for functions and variables
def calculate_face_distance(encoding1, encoding2):
    return np.linalg.norm(encoding1 - encoding2)

# Use type hints
def detect_faces(image: np.ndarray) -> List[Dict]:
    pass

# Document functions
def process_detection(image, threshold=0.7):
    """
    Process face detection on image.
    
    Args:
        image: Input image as numpy array
        threshold: Detection confidence threshold
        
    Returns:
        List of detected faces with bounding boxes
    """
    pass
```

### CSS/Tailwind

```jsx
// Group Tailwind classes logically
<div className="
  flex items-center justify-between
  w-full h-16
  px-4 py-2
  bg-white dark:bg-gray-800
  border border-gray-200
  rounded-lg shadow-sm
  hover:shadow-md transition-shadow
">
  Content
</div>
```

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(dashboard): add real-time camera status indicators

- Added pulse animation for active cameras
- Updated camera card component
- Added WebSocket connection for live updates

Closes #123
```

```bash
fix(auth): resolve login redirect issue

Fixed bug where users were redirected to login after
successful authentication

Fixes #456
```

## Project Structure

```
Face-Identifying-Security-system-/
├── frontend-react/      # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── services/    # API services
│   └── package.json
│
├── backend/             # Flask backend
│   ├── app.py          # Main application
│   ├── models.py       # Database models
│   └── requirements.txt
│
└── README.md
```

## Testing

### Frontend Tests

```bash
cd frontend-react
npm test
```

### Backend Tests

```bash
cd backend
pytest
```

## Questions?

Feel free to:
- Open an issue for discussion
- Join our community discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🚀
