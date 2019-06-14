import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
#http://danielhnyk.cz/creating-your-own-estimator-scikit-learn/

class MyPlugin(BaseEstimator, ClassifierMixin):
    """An example of classifier"""

    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def _meaning(self, x):
        if(x[0,0]>2): #App review (1 to 5) is bigger than 2
            return('Positive')
        else:
            return('Negative')

    def predict(self, X, y=None):
        return([self._meaning(x) for x in X])

