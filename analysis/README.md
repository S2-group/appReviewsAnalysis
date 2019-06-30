# appReviewsAnalysis classification tool

A classification script for Android app reviews and a plugin example.

## Installation

Suggested steps to install required components and run the script:

- Download and install [Anaconda Python], it is a free and open-source distribution of the Python and R programming languages for scientific computing
- Install a Python development environment (IDE) like [Pycharm] or [Spyder]
- Run the IDE and open [classification.py]
- `pip install -r requirements.txt` inside this folder to install all required Python packages
- Run the `classification.py` file from the terminal 'python classification.py -arg1 arg1 -arg2 arg2' with the desired arguments.

These are some example calls. For more information call -h or see documentation.

- python classification.py -labeled_data ./Reviews_manually_classified -classifiers 0,0,0,0,1,1,0 -pre 1,1 -param 0.8,5,25
- python classification.py -labeled_data ./Reviews_manually_classified -unlabeled_data ./Reviews_for_automatic_classification -labels PP,PC,MiP,TMP,UP,PRB,FU,SP,BT,AWP -classifiers 1,0,0,0,0,1,0 -pre 1,1,1 -param 0.8,5,25 -extraction 1 -knn 6

A [web interface] is also available for this tool and makes the usage easier for non-experts.

## Trubleshooting

The code makes use of several helper functions from Scikit-Learn, useful resources to fix issues you might encounter are:

- [Scikit-learn Examples]
- [Scikit-learn API Reference]

[Anaconda Python]: <https://www.anaconda.com/distribution/>
[Pycharm]: <https://www.jetbrains.com/pycharm/>
[Spyder]: <https://www.spyder-ide.org>
[classification.py]: <https://github.com/S2-group/appReviewsAnalysis/blob/master/analysis/classification.py>
[web interface]:<https://github.com/S2-group/appReviewsAnalysis/tree/master/frontend/server>
[Scikit-learn Examples]: <https://scikit-learn.org/stable/auto_examples/index.html>
[Scikit-learn API Reference]: <https://scikit-learn.org/stable/modules/classes.html>
