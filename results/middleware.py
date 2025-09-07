import threading
import logging
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)

class TimeoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.timeout = getattr(settings, 'REQUEST_TIMEOUT', 28)  # 10 seconds default

    def __call__(self, request):
        response = [None]
        exception = [None]
        
        def target():
            try:
                response[0] = self.get_response(request)
            except Exception as e:
                exception[0] = e

        # Create and start the worker thread
        thread = threading.Thread(target=target)
        thread.daemon = True
        thread.start()
        
        # Wait for the thread to complete or timeout
        thread.join(timeout=self.timeout)

        if thread.is_alive():
            # Thread is still running - timeout occurred
            logger.warning(f"Request timeout for {request.path} ({request.method})")
            return JsonResponse({
                'error': 'Request timeout',
                'message': f'Request took longer than {self.timeout} seconds'
            }, status=408)

        if exception[0]:
            # Re-raise the exception if one occurred
            raise exception[0]

        return response[0]

# Alternative approach using async timeout (if you're using async views)
import asyncio
from django.utils.decorators import sync_and_async_middleware

@sync_and_async_middleware
def async_timeout_middleware(get_response):
    """
    Middleware that works with both sync and async views
    Use this if you have async views in your Django app
    """
    timeout = getattr(settings, 'REQUEST_TIMEOUT', 10)

    if asyncio.iscoroutinefunction(get_response):
        async def middleware(request):
            try:
                return await asyncio.wait_for(
                    get_response(request), 
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                logger.warning(f"Async request timeout for {request.path}")
                return JsonResponse({
                    'error': 'Request timeout',
                    'message': f'Request took longer than {timeout} seconds'
                }, status=408)
    else:
        def middleware(request):
            response = [None]
            exception = [None]
            
            def target():
                try:
                    response[0] = get_response(request)
                except Exception as e:
                    exception[0] = e

            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(timeout=timeout)

            if thread.is_alive():
                logger.warning(f"Request timeout for {request.path}")
                return JsonResponse({
                    'error': 'Request timeout',
                    'message': f'Request took longer than {timeout} seconds'
                }, status=408)

            if exception[0]:
                raise exception[0]

            return response[0]

    return middleware

# Simple decorator approach for specific views
from functools import wraps
from django.http import JsonResponse

def timeout_view(timeout_seconds=10):
    """
    Decorator to add timeout to specific views
    Usage: @timeout_view(15)  # 15 second timeout
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            result = [None]
            exception = [None]
            
            def target():
                try:
                    result[0] = view_func(request, *args, **kwargs)
                except Exception as e:
                    exception[0] = e
            
            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(timeout=timeout_seconds)
            
            if thread.is_alive():
                logger.warning(f"View timeout: {view_func.__name__}")
                return JsonResponse({
                    'error': 'Request timeout',
                    'message': f'Request took longer than {timeout_seconds} seconds'
                }, status=408)
            
            if exception[0]:
                raise exception[0]
                
            return result[0]
        
        return wrapped_view
    return decorator