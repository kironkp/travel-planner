import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { UserContext } from '../../context/UserContext'
import * as tripService from '../../services/tripService'

const TripShow = () => {
    const { user } = useContext(UserContext)
    const navigate = useNavigate()
    const location = useLocation()
    const { tripId } = useParams()
    const [trip, setTrip] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [commentError, setCommentError] = useState('')
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

    useEffect(() => {
        if (!user) return

        const fetchTrip = async () => {
            try {
                const data = await tripService.show(tripId)
                setTrip(data.trip || null)
            } catch (err) {
                setError('Unable to load this trip. Please try again.')
                console.log(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTrip()
    }, [user, tripId])

    const handleEditClick = () => {
        navigate(`/trips/${tripId}/edit`)
    }

    const handleDeleteClick = async () => {
        if (!window.confirm('Are you sure you want to delete this trip?')) return
        setIsDeleting(true)
        setError(null)
        try {
            await tripService.destroy(tripId)
            navigate('/')
        } catch (err) {
            setError(err.message || 'Unable to delete this trip.')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCommentSubmit = async (evt) => {
        evt.preventDefault()
        const nextCommentText = commentText.trim()
        if (!nextCommentText) return

        setCommentError('')
        setIsSubmittingComment(true)
        try {
            const data = await tripService.createComment(tripId, nextCommentText)
            setTrip(data.trip || trip)
            setCommentText('')
        } catch (err) {
            setCommentError(err.message || 'Unable to post comment.')
        } finally {
            setIsSubmittingComment(false)
        }
    }

    if (!user) {
        return (
            <main className='dashboard'>
                <h1>Trip Details</h1>
                <p>You need to be signed in to view trips.</p>
            </main>
        )
    }

    if (isLoading) {
        return (
            <main className='dashboard'>
                <h1>Trip Details</h1>
                <p>Loading trip...</p>
            </main>
        )
    }

    if (error) {
        return (
            <main className='dashboard'>
                <h1>Trip Details</h1>
                <p>{error}</p>
            </main>
        )
    }

    if (!trip) {
        return (
            <main className='dashboard'>
                <h1>Trip Details</h1>
                <p>Trip not found.</p>
            </main>
        )
    }

    const tripOwnerId =
        typeof trip.user === 'string'
            ? trip.user
            : trip.user?._id || trip.user?.id
    const isOwner = tripOwnerId === user._id
    const fromFeed = location.state?.fromFeed === true
    const comments = Array.isArray(trip.comments) ? trip.comments : []

    return (
        <main className='dashboard'>
            <h1>{trip.location}</h1>
            {trip.photoUrl ? (
                <img
                    className='trip-show-photo'
                    src={trip.photoUrl}
                    alt={`Trip to ${trip.location}`}
                />
            ) : null}
            {trip.user?.username ? (
                <p><strong>Shared by:</strong> {trip.user.username}</p>
            ) : null}
            <p>
                {new Date(trip.startDate).toLocaleDateString()} -{' '}
                {new Date(trip.endDate).toLocaleDateString()}
            </p>
            {trip.accommodations ? (
                <p><strong>Accommodations:</strong> {trip.accommodations}</p>
            ) : null}
            {trip.tips ? (
                <p><strong>Tips:</strong> {trip.tips}</p>
            ) : null}
            <section style={{ marginTop: '1.2rem' }}>
                <h2>Comments</h2>
                {comments.length === 0 ? (
                    <p>No comments yet.</p>
                ) : (
                    <ul className='dashboard-list'>
                        {comments.map((comment) => {
                            const commentId = comment._id || comment.id
                            const authorName = comment.author?.username || 'Traveler'

                            return (
                                <li key={commentId} style={{ marginBottom: '0.75rem' }}>
                                    <strong>{authorName}:</strong> {comment.text}
                                </li>
                            )
                        })}
                    </ul>
                )}

                
                    <form onSubmit={handleCommentSubmit} style={{ marginTop: '0.75rem' }}>
                        <label htmlFor='commentText'>Leave a comment:</label>
                        <textarea
                            id='commentText'
                            name='commentText'
                            rows='3'
                            value={commentText}
                            onChange={(evt) => setCommentText(evt.target.value)}
                            style={{ width: '100%', marginTop: '0.45rem' }}
                            placeholder='Share something helpful!'
                            required
                        />
                        {commentError ? <p>{commentError}</p> : null}
                        <button type='submit' disabled={isSubmittingComment || !commentText.trim()}>
                            {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                    </form>
                
            </section>
            {isOwner ? (
                <div>
                    <button type='button' onClick={handleEditClick}>
                        Edit Trip
                    </button>
                    <button
                        type='button'
                        className='danger-btn'
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        style={{ marginLeft: '1rem' }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Trip'}
                    </button>
                </div>
            ) : null}
            {fromFeed ? (
                <div style={{ marginTop: '1rem' }}>
                    <button type='button' onClick={() => navigate('/')}>
                        Back to Feed
                    </button>
                </div>
            ) : null}
        </main>
    )
}


export default TripShow
