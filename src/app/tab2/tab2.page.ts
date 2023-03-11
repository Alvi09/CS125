import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Tab2Service } from './tab2.service';
import { NavController } from '@ionic/angular';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})


export class Tab2Page implements OnInit {
  // https://en.wikipedia.org/wiki/List_of_diets
  public diet_options = ["Low calorie diet", "Low carbohydrate diet", "Low fat diet", "Keto diet", "GERD diet"];
  public diets = [...this.diet_options];
  public foods_data: any = {};
  public food_categories: Array<String> = [];
  public recommended_results: any = {};
  public recommended_results_display: any[] = [];
  diet_clickedButton = false;
  chosen_diet = "";

  constructor(private tab2Service: Tab2Service, private loadingCtrl: LoadingController, private navController: NavController) {}

  // load all data before any actions take place
  async ngOnInit() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading data...',
      spinner: 'bubbles',
    });
    await loading.present();

    for (var i = 0; i < 5; i++) {
      // await this.sleep();

      this.tab2Service.getFoundationFoods(i+1).subscribe((res: any) => {
        const food_results = res['foods'];
        // console.log(food_results);

        Object.keys(food_results).forEach((key: any) => {
          const id = food_results[key].fdcId;
          const name = food_results[key].description;
          const publicationDate = food_results[key].publicationDate;
          const nutrients = food_results[key].foodNutrients;
          const foodCategory = food_results[key].foodCategory;
          const score = food_results[key].score;

          const d = {id: id, name: name, publicationDate: publicationDate, nutrients: nutrients, foodCategory: foodCategory, score: score, sortHelper: 0};
          // console.log(d);

          if (!this.food_categories.includes(foodCategory)) {
            this.food_categories.push(foodCategory);
            this.foods_data[foodCategory] = [d];
          } else {
            this.foods_data[foodCategory].push(d);
          }
        })
      })

      // console.log('food_categories', this.food_categories)
    }

    loading.dismiss();
    console.log("foods", this.foods_data);
  }

  // nutritional amounts are based on every 100 grams of that food
  async getRecommendations(event: any) {
    this.chosen_diet = event.target.innerText
    var diet_type = "low";
    console.log(this.chosen_diet);

    if (this.chosen_diet.toLowerCase().includes("low")) {
      diet_type = "low";
    } 
    
    if (this.chosen_diet.toLowerCase().includes("keto")) {
      diet_type = "keto";
    }
    
    const loading = await this.loadingCtrl.create({
      message: 'Recommending foods...',
      spinner: 'bubbles',
    });
    await loading.present();
    await this.sleep();

    this.recommended_results = this.foods_data;

    // sort each category by low/high diet (e.g. calorie, carbohydrate, etc.)
    for (var foodCategory in this.foods_data) {
      const foods_list = this.foods_data[foodCategory];

      console.log(foodCategory, foods_list)

      for (var food in foods_list) {
        const foodNutrients = foods_list[food].nutrients;
        let nutrient_amount = 0;
        let grams_amount = 100;
  
        for (var key in foodNutrients) {
          // low calorie diet
          if (this.chosen_diet.toLowerCase() === "low calorie diet") {
            if (foodNutrients[key].unitName == 'KCAL') {
              nutrient_amount = foodNutrients[key].value;
              grams_amount = 100;
  
              break;
            } 
          }

          // low carbohydrate diet
          if (this.chosen_diet.toLowerCase() === "low carbohydrate diet") {
            if (foodNutrients[key].nutrientName == 'Carbohydrate, by difference') {
              nutrient_amount = foodNutrients[key].value;
              grams_amount = 100;
  
              break;
            }
          }

          // low fat and gerd diet
          if (this.chosen_diet.toLowerCase() === "low fat diet" || this.chosen_diet.toLowerCase() === "gerd diet") {
            if (foodNutrients[key].nutrientName == 'Total fat (NLEA)') {
              nutrient_amount = foodNutrients[key].value;
              grams_amount = 100;
  
              break;
            }
          }

          // keto diet (high fat, moderate protein, very low carbs)
          if (this.chosen_diet.toLowerCase() === "keto diet") {
            if (foodNutrients[key].nutrientName == 'Total lipid (fat)') {
              nutrient_amount = foodNutrients[key].value;
              grams_amount = 100;
  
              break;
            }
          }
        }

        // console.log(`${foods_list[food].name} has ${nutrient_amount} ${foodNutrients[key].unitName} for every ${grams_amount} grams`);
        this.recommended_results[foodCategory][food].sortHelper = nutrient_amount;
        this.recommended_results[foodCategory][food]['servingAmount'] = grams_amount;
      }

      this.recommended_results[foodCategory].sort(function(a: any, b: any) {
        if (diet_type === "low") {
          return a.sortHelper - b.sortHelper
        }

        if (diet_type === "keto") {
          // https://stackoverflow.com/questions/6913512/how-to-sort-an-array-of-objects-by-multiple-fields
        }

        return b.sortHelper - a.sortHelper;
      })
    }

    for (var k in this.recommended_results) {
      // extract top n results
      this.recommended_results[k] = this.recommended_results[k].slice(0, 3);

      for (var foodk of this.recommended_results[k]) {
        this.recommended_results_display.push(foodk);
      }
    }

    console.log('recommended results', this.recommended_results);
    loading.dismiss();

    // redirect to a separate page that will display the recommendation results
    this.diet_clickedButton = true;
  };

  searchFilter(event: any) {
    const query = event.target.value.toLowerCase();
    this.diets = this.diet_options.filter(d => d.toLowerCase().indexOf(query) > -1);
  }

  sleep() {
    return new Promise(resolve => setTimeout(resolve, 3000));
  }

}
